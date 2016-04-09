all:
	make init-db && make tsp
init-db:
	./init_db.js
tsp:
	g++ -g -Wall -o TSP ../TSP/main.cpp
clean:
	$(RM) TSP robo-ops.db *.log nodes.txt && rm -rf photos
