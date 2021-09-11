# quick-data-reporter

UI5 App for analyzing content of ABAP Database tables/Database views or CDS Views

## Installation

```sh
npm i
```

Install UI5 tooling globally

```sh
npm i -g @ui5/cli
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

### Settings template for service tests in `/test/service` for REST Client Extension

```json
  "rest-client.environmentVariables": {
    "$shared": {
      "sap_dev_server": "<NW server URL>",
      "sap_dev_user": "<NW user>",
      "sap_dev_pwd": "<NW password>"
    }
  },
```

### Script commands

- With real data  

  ```sh
  npm start
  ```

- With mock data  

  ```sh
  npm run start:mock
  ```

## Deployment

```sh
npm run deploy
```

## Dependencies

If the app is running in production mode the following [abapGit](https://github.com/abapGit/abapGit) Repositories are required to be installed on the ABAP system

- [abap-qdrt](https://github.com/stockbal/abap-qdrt)
