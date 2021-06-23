# quick-data-reporter

UI5 App for analyzing content of ABAP Database tables/Database views or CDS Views

## Installation
```
$ npm i
```
Install UI5 tooling globally
```
$ npm i -g @ui5/cli
```

## Development Server
### `.env` File Template
```env
# Proxy to REST service (SICF path /sap/zqdrtrest)
HTTP_PROXY_AUTH_USER=<username>
HTTP_PROXY_AUTH_PASS=<password>
HTTP_PROXY_TARGET=<server>

# Deployment on OnPrem System
UI5_TASK_NWABAP_DEPLOYER__USER=<username>
UI5_TASK_NWABAP_DEPLOYER__PASSWORD=<password>
UI5_TASK_NWABAP_DEPLOYER__SERVER=<server>
UI5_TASK_NWABAP_DEPLOYER__CLIENT=<client>
```

### Script commands
- With real data   
  ```
  $ npm start
  ```
- With mock data  
  ```
  $ npm run start:mock
  ```

## Deployment
```
$ npm run deploy
```

## Dependencies
If the app is running in production mode the following [abapGit](https://github.com/abapGit/abapGit) Repositories are required to be installed on the ABAP system 

- [abap-qdrt](https://github.com/stockbal/abap-qdrt)
