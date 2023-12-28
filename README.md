# SwiftCDN

#### A Quick and Easy Content Delivery Network that you can deploy!

Ever needed a quick cdn setup?
Well we've got you, SwiftCDN is a free to use CDN that you can deploy on your server (or computer) for free using Docker!
All you have to do is make sure Docker is installed, download the `compose.yml` file and you're set!

### Installation

Just follow the commands below to deploy your own instance of SwiftCDN!

```
mkdir swift-cdn && cd swift-cdn
curl -o docker-compose.yml -L https://raw.githubusercontent.com/Bracketed/SwiftCDN/main/compose.yml
docker compose up -d
```

The SwiftCDN server will now be running on :3000 unless you have specified otherwise!

ENV Variables:

-   `EXPRESS_PORT` - Port the SwiftCDN Frontend server will run on (default: 3000)
-   `COUCHDB_PORT` - The port for your couchdb backend server (default: 5984)
-   `UPLOAD_LIMIT` - Upload limit, in Megabytes (default: 1000)
-   `BACKEND_USERNAME` - Username for CouchDB (default: admin)
-   `BACKEND_PASSWORD` - Password for CouchDB (default: cdn)

### Usage

-   PUT requests to /upload with a file or files attached will upload them and return either a link to the file or an array of links to the files you have uploaded.
-   GET requests to / will return the versioning info.
-   GET requests to /{file}/download will download the file to your local drive.
-   GET requests to /{file}/info will show you the json info of the file.
-   GET requests to /{file} will present the file or download it depending on its extension.

### Planned Features

-   Web Panel
-   Proper Security for uploading
-   View all files route
-   Users
-   File deletion
