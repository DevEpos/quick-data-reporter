import AjaxJSONModel from "./AjaxJSONModel";

import Context from "sap/ui/model/Context";
import Filter from "sap/ui/model/Filter";
import ListBinding from "sap/ui/model/ListBinding";
import Sorter from "sap/ui/model/Sorter";
import ChangeReason from "sap/ui/model/ChangeReason";
import Log from "sap/base/Log";
import isEmptyObject from "sap/base/util/isEmptyObject";

type Segment = {
    start: number;
    end: number;
};
/**
 * List binding implementation which supports any kind of
 * asynchronous data loading.
 *
 * @namespace com.devepos.qdrt.model
 */
export default class AjaxListBinding extends ListBinding<AjaxJSONModel> {
    metadata = {
        publicMethods: ["getLength"]
    };
    private _length: number;
    private _isLengthFinal: boolean;
    private _threshold: number;
    private _isRefresh = false;
    /**
     * Simple indexed based list of all loaded entries.
     */
    private _keys: number[];
    private _lastLength: number;
    private _lastStartIndex: number;
    private _lastThreshold: number;
    private _lastEndIndex: number;
    private _lastContexts: Context[];
    private _lastContextDataSet: object[];
    private _isIgnoreSuspend = false;
    private _isRequestPending = false;
    /**
     * Creates new AjaxListBinding. Should only be called by the corresponding model {@see com.devepos.qdrt.model.AjaxJSONModel}
     *
     * @param model Model instance that this binding belongs to
     * @param path Binding path for this binding; a relative path will be resolved relative to a given context
     * @param context Context to be used to resolve a relative path
     * @param sorters Initial sort order (can be either a sorter or an array of sorters)
     * @param filters Predefined filter/s (can be either a filter or an array of filters)
     * @param additionBindingParams Additional, implementation-specific parameters that should be used by the new list binding;
     */
    constructor(
        model: AjaxJSONModel,
        path: string,
        context: Context,
        sorters?: Sorter | Sorter[],
        filters?: Filter | Filter[],
        additionBindingParams?: object
    ) {
        super(model, path, context, sorters, filters, additionBindingParams);

        this._threshold = (additionBindingParams as any)?.threshold || 0;
        this._resetData();
    }

    initialize(): this {
        if (!this.bSuspended) {
            const object = this.oModel.getObject(this.sPath, this.oContext);
            if ((Array.isArray(object) && object.length) || !isEmptyObject(object)) {
                this._fireChange({ reason: ChangeReason.Change });
            } else {
                this._fireRefresh({ reason: ChangeReason.Refresh });
            }
        }
        return this;
    }

    isLengthFinal(): boolean {
        return this._isLengthFinal;
    }

    /*
     * Returns the length of this binding
     */
    getLength(): number {
        return this._length;
    }

    /**
     * Return contexts for the list.
     *
     * @param startIndex The start index of the requested contexts
     * @param length The requested amount of contexts
     * @param threshold The threshold value
     * @return {sap.ui.model.odata.v2.Context[]}
     *   The array of contexts for each row of the bound list
     */
    getContexts(startIndex: number, length: number, threshold: number): Context[] {
        // store new parameters for next call
        this._lastLength = length;
        this._lastStartIndex = startIndex;
        this._lastThreshold = threshold;

        // Set default values if startindex, threshold or length are not defined
        if (!startIndex) {
            startIndex = 0;
        }
        if (!length) {
            length = this.oModel.iSizeLimit;
            if (this._isLengthFinal && this._length < length) {
                length = this._length;
            }
        }
        if (!threshold) {
            threshold = 0;
        }
        // reset threshold if it was set in the constructor: taken from ODataListBinding.operationMode.Auto
        if (this._threshold >= 0) {
            threshold = Math.max(this._threshold, threshold);
        }

        const contexts = this._getContexts(startIndex, length);
        const limit = this._isLengthFinal ? this._length : undefined;
        const missingSegment = this._determineMissingSegment(this._keys, startIndex, length, threshold, limit);

        // load missing segment if necessary
        if (!this._isRequestPending && missingSegment) {
            this._loadData(missingSegment.start, missingSegment.end - missingSegment.start);
            // this information is needed for the Growing feature in sap.m library (e.g. sap.m.GrowingEnabledment);
            (contexts as any).dataRequested = true;
        }

        if (this._isRefresh) {
            this._isRefresh = false;
        } else {
            const contextDataSet: object[] = [];
            // store current context data and contexts
            for (const context of contexts) {
                contextDataSet.push(this.getContextData(context));
            }
            this._lastContextDataSet = contextDataSet.slice(0);
            this._lastContexts = contexts.slice(0);
            this._lastEndIndex = startIndex + length;
        }

        return contexts;
    }

    getCurrentContexts(): Context[] {
        return this._lastContexts;
    }

    refresh(): void {
        this._resetData();
        this._fireRefresh({ reason: ChangeReason.Sort });
    }

    _fireRefresh(mParameters: object): void {
        if (this.oModel.resolve(this.sPath, this.oContext)) {
            this._isRefresh = true;
            this.fireEvent("refresh", mParameters);
        }
    }

    private _determineMissingSegment(
        keys: number[],
        startIndex: number,
        length: number,
        prefetchLimit: number,
        limit: number
    ): Segment {
        const segmentToRead = { start: startIndex, end: startIndex + length } as Segment;
        this._adjustSegmentEdges(keys, segmentToRead, prefetchLimit);

        if (limit === undefined) {
            limit = Infinity;
        }
        const end = Math.min(segmentToRead.end, limit);
        const n = Math.min(end, Math.max(segmentToRead.start, keys.length) + 1);

        let gapStartIndex = -1;
        const intervals: Segment[] = [];
        for (let i = segmentToRead.start; i < n; i++) {
            if (keys[i] !== undefined) {
                if (gapStartIndex >= 0) {
                    intervals.push({ start: gapStartIndex, end: i });
                    gapStartIndex = -1;
                }
            } else if (gapStartIndex < 0) {
                gapStartIndex = i;
            }
        }
        if (gapStartIndex >= 0) {
            intervals.push({ start: gapStartIndex, end });
        }

        if (intervals.length) {
            return {
                start: intervals[0].start,
                end: intervals[intervals.length - 1].end
            };
        } else {
            return null;
        }
    }

    private _adjustSegmentEdges(keys: number[], segment: Segment, prefetchLimit: number) {
        const isDataMissing = (start: number, end: number): boolean => {
            for (let i = start; i < end; i++) {
                if (keys[i] === undefined) {
                    return true;
                }
            }
            return false;
        };

        // check if there is at least half the prefetch length at the right side
        if (isDataMissing(segment.end, segment.end + prefetchLimit / 2)) {
            segment.end += prefetchLimit;
        }

        // check if there is at least half the prefetch length at the left side
        if (isDataMissing(Math.max(segment.start - prefetchLimit / 2, 0), segment.start)) {
            segment.start -= prefetchLimit;

            if (segment.start < 0) {
                // reduce the end
                segment.end += segment.start;
                if (isNaN(segment.end)) {
                    segment.end = Infinity;
                }
                segment.start = 0;
            }
        }
    }

    /**
     * Loads missing data from the server
     * @param startIndex starting index
     * @param length number of entries that should be loaded
     */
    private async _loadData(startIndex: number, length: number): Promise<void> {
        const path = this.getResolvedPath();
        try {
            this.fireDataRequested(null);
            this._isRequestPending = true;
            await this.oModel.requestData(path, startIndex, length, !this._isLengthFinal, data => {
                if (!this._isLengthFinal && data?.count) {
                    this._isLengthFinal = true;
                    this._length = data.count;
                }
                if (data?.results && Array.isArray(data.results)) {
                    for (let i = 0; i < data.results.length; i++) {
                        this._keys[startIndex] = startIndex++;
                    }
                }

                this.fireDataReceived({ data });
            });
        } catch (error) {
            Log.error(error?.toString());
            this.fireDataReceived(null);
        }
        this._isRequestPending = false;
    }

    /**
     * Checks if the data in the binding was updated
     * @param forceUpdate forces the update notification of this bindings' data
     */
    checkUpdate(forceUpdate: boolean): void {
        if (this.bSuspended && !this._isIgnoreSuspend && !forceUpdate) {
            return;
        }

        const contexts = this._getContexts(this._lastStartIndex, this._lastLength);
        let changedDetected = false;
        if (this._lastContexts?.length !== contexts?.length) {
            changedDetected = true;
        } else {
            for (let i = 0; i < this._lastContextDataSet.length; i++) {
                if (this._lastContextDataSet[i] !== this.getContextData(contexts[i])) {
                    changedDetected = true;
                    break;
                }
            }
        }

        if (forceUpdate || changedDetected) {
            this._fireChange({ reason: ChangeReason.Change });
        }
    }

    getResolvedPath(): string {
        return this.isRelative() ? this.oModel.resolve(this.sPath, this.oContext) : this.sPath;
    }

    /**
     * Perform filtering
     */
    filter(): this {
        // filtering is implemented in the Ajax call
        return this;
    }
    /**
     * Perform sorting
     */
    sort(): this {
        // sorting is implemented in the Ajax call
        return this;
    }

    private _getContexts(startIndex: number, length: number): Context[] {
        const contexts: Context[] = [];

        let prefix = this.getResolvedPath();
        if (!startIndex) {
            startIndex = 0;
        }
        if (!length) {
            length = this.oModel.iSizeLimit;
            if (this._isLengthFinal && this._length < length) {
                length = this._length;
            }
        }

        if (!prefix?.endsWith("/")) {
            prefix += "/";
        }
        //	Loop through known data and check whether we already have all rows loaded
        for (let i = startIndex; i < startIndex + length; i++) {
            if (this._keys[i] === undefined) {
                break;
            }
            const context = this.oModel.getContext(`${prefix}${i}`);
            contexts.push(context);
        }

        return contexts;
    }

    private _resetData() {
        this._keys = [];
        this._length = 0;
        this._isLengthFinal = false;
    }
}
