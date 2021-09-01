# DC-Demo

Demo project for generating a client request and filling out a questionnaire

---

## Installation

To run the application, you need to install [nodejs](https://nodejs.org/en/download/)
and [angular](https://angular.io/guide/setup-local) on your machine.

To install the necessary packages, use the command:

```shell
npm install

# or to solve the dependency-tree-error
npm install --legacy-peer-deps
```

After that, to run the application locally, you can use the following command, which will start the local server on the http://localhost:4200/.

```shell
ng serve --open
```

To build and archive the application for later deployment to a server, use the command:

```shell
ng build --prod
```

Next, copy the contents of the folder [dist/dc-demo](dist/dc-demo) to the root folder of the server. When using subfolders to store application files on the server, you must run the **build** command with the **--base-href**
parameter and specify the subfolder path relative to the root directory on the server.

For the application routing to work correctly, additional server configuration is required, depending on the server.

For example, [here](https://ozenero.com/how-to-deploy-angular-on-nginx-remote-server-example-use-vultr-vps-hosting#Build_Angular_Client) is an example of deploying an angular application to a [nginx](https://nginx.org/ru/) server.
