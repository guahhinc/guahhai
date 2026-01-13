Single-file FastAPI shim that sits in front of a folder of memory snapshots and answers two questions:

1.  “What is the newest snapshot?”  
   GET /memory/latest  
   Returns the file with the highest (major, minor) tuple.

2.  “Give me snapshot 8-1.”  
   GET /memory/v8-1  
   Returns exactly that file or 404 if it does not exist.

127.0.0.1:5858 -> nginx upstream (nginx.conf needs Cloudflare Origin certificates).
Uses /memory folder at root.

- kamalei