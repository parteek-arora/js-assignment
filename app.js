/* =====================================
 API to upload file to server.File size max 2 GB and file type should be audio/video
 Without using any framework or any third party modules 
 Notes :- For testing the api, i have created a simpler web page with jquery
            Run   node app
            open  localhost:3000 in browser
            select the file and hit upload button
            check the file in asset folder
=====================================
*/
const http = require("http");
const fs = require("fs");

const port = 3000;

//create a node js server
const server = http.createServer((req, res) => {
    //set response content type to json
    res.setHeader('Content-Type', 'application/json');

    //api for path / and method post
    if (req.url == "/" && req.method == "POST") {
        try {

            //validations for the content length of the binary file [max 2gb allowed].
            const contentBytes = req.headers['content-length'] || 0;
            if (contentBytes == 0) {
                throw { message: "Missing header [content-length] or file is missing." }
            } else if (contentBytes > 2147483648) {
                throw { message: "The maximum upload size for a single file is 2gb." }
            }

            //check for the content type header 
            let contentType = req.headers['content-type'] || "";
            contentType = contentType.split("/");

            //only audio and video files are allowed
            if (contentType[0] == "audio" || contentType[0] == "video") {

                //file path where the file will be stored -> should be absolute path
                const filePath = `${process.cwd()}/uploads/file-${Date.now()}`;

                // create write stream , with w flag , on given path
                let filestream = fs.createWriteStream(filePath, { flags: 'w' });
                let progress = 0;
                /*event when data is recived in chunks this event cal be used to calculate the progress
                @Note :- uncomment below code to print check the percentage upload
                */

                // req.on('data', (chunk) => {
                //     progress += chunk.length;
                //     console.log('percent complete: ' + parseInt((progress / contentBytes) * 100) + '%\n');
                // });

                /* 
                   pipe the readable request stream with binary file to the writable stream
                   this will read the file in chuncks and simultanously write file to disk into chunks 
                */
                req.pipe(filestream);

                /*@desc-> event fired on close i.e when file uploaded on disk completely                 */
                filestream.on('close', () => {
                    res.statusCode = 200;
                    res.end(JSON.stringify({ status: 1, message: "success", path: filePath }));
                    console.log(`path: ${req.url} , status : 200`);
                });

                /*@desc -> error event  if any error occur in writing the file */
                filestream.on('error', (error) => {
                    handleError(req, res, { message: error.message, status: 500 })
                });
            } else {
                throw { message: "Only audio and video files are supported" }
            }
        } catch (error) {
            handleError(req, res, { message: error.message, status: 400 })
        }
    } else if (req.url == "/" && req.method == "GET") {
        //route for render the html to test the upload api
        res.setHeader('Content-Type', 'text/html');
        const content = fs.readFileSync(process.cwd() + "/index.html");
        res.end(content);
        console.log(`path: ${req.url} , status : 200`)
    } else {
        handleError(req, res, { message: "Not Found", status: 404 })
    }

});

function handleError(req, res, error) {
    res.statusCode = error.status;
    res.end(JSON.stringify({ status: 0, message: error.message }));
    console.error(`path: ${req.url} , status : ${error.status}`)
}

server.listen(port, () => {
    console.log(`Server listen to port:${port}`);
});