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

Planned Features:

-   Web Panel
-   Proper Security for uploading
-   View all files route
-   Users
-   File deletion
