from livereload import Server, shell

server = Server()

# Watch all files in the /docs folder
server.watch("docs/**/*", lambda: print("Change detected!"))

# Serve /docs 
server.serve(root="docs", port=8000)