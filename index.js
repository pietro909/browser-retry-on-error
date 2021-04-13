// Require the core node modules.
var chalk = require( "chalk" );
var cluster = require( "cluster" );
var http = require( "http" );
var os = require( "os" );

// ----------------------------------------------------------------------------------- //
// ----------------------------------------------------------------------------------- //

// MASTER PROCESS.
// --
// The Master process, in the cluster module, is responsible for spawning child-
// processes that all share the same port-listening. The Master will round-robin (on
// most systems) requests to the child / worker processes.
if ( cluster.isMaster ) {

	console.log( chalk.red.bold( "[Cluster]" ), "Master is now running.", process.pid );

	// Ensure that there are at least 2 workers to enable redundancy and availability.
	// This way, if one process dies, there should always be another process ready
	// to take on work.
	var concurrencyCount = Math.max( 2, ( process.env.WEB_CONCURRENCY || os.cpus().length ) );

	// Spawn child / worker processes.
	for ( var i = 0 ; i < concurrencyCount ; i++ ) {

		cluster.fork();

	}

	// Listen for Worker process death.
	cluster.on(
		"exit",
		function handleExit( worker, code, signal ) {

			console.log( chalk.red.bold( "[Cluster]" ), "Worker has exited.", worker.process.pid );

		}
	);

// WORKER PROCESS.
// --
// The Worker process, in the cluster module, is responsible for implementing the actual
// request handling for the application. Each Worker is a completely separate instance
// of the application and shares no memory with either the Master or the other Workers.
} else {

	console.log( chalk.red( "[Worker]" ), "Worker has started.", process.pid );

	// Setup the application server.
	http
		.createServer(
      function( request, response ) {

        if (/kill/.test(request.url)) {

          console.log( chalk.red( "[Worker]" ), `fetching ${request.url}`, process.pid );
          // For this demo, we're just going to exit the Worker immediately so we
          // can see how the Browser reacts to this type of failure.
          // --
          // NOTE: Produces the ERR_CONNECTION_REFUSED error response.
          process.exit( 1 );

          // NOTE: If we threw an uncaught error, instead of exiting, we'd get
          // the ERR_EMPTY_RESPONSE error response.
        }

        response.writeHeader(200, {"Content-Type": "text/html"});
        response.write(`
          <button onclick="fetch('http://localhost:3000/kill')">press to kill</button>
        `);
        response.end();
      }
		)
		.listen( 3000 )
	;

}
