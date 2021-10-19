// Define any types that should be globally available
interface ResizableControl {
    setHeight?(height: string): void;
    getHeight?(): string;
    setWidth?(width: string): void;
    getWidth?(): string;
}
