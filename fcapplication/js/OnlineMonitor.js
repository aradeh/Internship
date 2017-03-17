/*
OnlineMonitor.js
	Four states are defined for the monitor - online, offline, disconnected, and probing.
	Responds to events defined in the transitions object, where you can add new listeners
	 and the state transitions they define.
*/

define([],function() {
	//var e = document.createEvent('Event'); e.initEvent('goOffline',true,true); window.dispatchEvent(e);
	//console.log('osm');

	var osm = {}, 
	currentState = 'offline',
	validStates = ['probing','online','offline','disconnected'],
	transitions = {
		//states in testing mode - online to offline
		goOnline: 
		{
			online: 'online',
			offline: 'online',
			disconnected: 'online',
			probing: 'online'
		},
		goOffline: 
		{	
			online: 'offline',
			offline: 'offline',
			disconnected: 'offline',
			probing: 'offline'
		},
		startProbing: {
			offline: 'probing',
			disconnected: 'probing'
		},
		noHb: {
			online: 'offline',
			probing: 'disconnected',
			offline: 'disconnected'
		},
		online: { //browser event
			online: 'online',
			probing: 'online',
			offline: 'online',
			disconnected: 'probing'
		},
		offline: { //browser event
			online: 'offline',
			probing: 'offline',
			offline: 'offline',
			disconnected: 'offline'
		}

	}, 
	stateHandlers = {
		online: function() {
			console.log('we just went online...');
			//$('#btn2').button('reset');
			$('#btn2').removeClass('offline');
		},
		offline: function() {
			console.log('we just went offline...');
			//$('#btn2').button('toggle');
			$('#btn2').addClass('offline');
		},
		disconnected: function() {
			console.log('we are disconnected...');
		},
		probing: function() {
			console.log('we are probing...');
		}
	};

    function startHeartbeat() {
        setInterval(heartBeat, 10000);
    }
    
    //set the heartBeat function to the server on which the web services are deployed
    function heartBeat() {
        $.ajax({
                url: 'http://google.com'
            })
            .done(function() {
                console.log('hb...');
            })
            .fail(function() {
                console.log('hb ERR...');

				var e = document.createEvent('Event'); 
				e.initEvent('noHb',true,true); 
				window.dispatchEvent(e);
            })
            .always(function() {
            });   
    }
    
	function stateIsValid(state) {
		return validStates.indexOf(state) !== -1; 
	}

	//using the transitions object, setup listeners
	function setupBehaviors() {
		for( evt in transitions ) {
			//console.log(evt);
			var fromAndTo = [];
			for( state in transitions[evt] ) {
				//console.log(" "+state+" :"+transitions[evt][state]);

				fromAndTo.push([state,transitions[evt][state]]);

			}
			//here we add listeners for the transitions - first, a log mechanism to help debug
			//window.addEventListener(evt, logListener.bind(this,fromAndTo,evt), false);
			window.addEventListener(evt, handleListener.bind(this,fromAndTo,evt), false);
		}
	}

	//logs every state transition for the given event
	function logListener(fromAndTo,evt) {
		console.log('event listener for : '+evt);
		for( x=0; x<fromAndTo.length;x++) {
			console.log('changing from : '+fromAndTo[x][0]+' to : '+fromAndTo[x][1]);
		} 
	}

	//change the state
	function handleListener(fromAndTo,evt) {
		//console.log('event handler for : '+evt);
		console.log('was::'+currentState);
		var newState = transitions[evt][currentState];
		stateHandlers[newState].call(null,null);
		//valid transition?
		if( newState ) {
			currentState = newState;
			console.log('is::'+currentState);
		} else {
			console.log('invalid state');
		}
	}
    
    //testing only - all changes should happen through events
   	function setState(newState) {
        //console.log('was::'+currentState);
        if( stateIsValid(newState) ) {
            currentState = newState;
            //console.log('is::'+currentState);
        } else {
            console.log('ERR: invalid online/offline state ');
        }
    }

    function getState() {
        return currentState;
    }

	function init() {
		//console.log('setup OnlineMon...');
		setupBehaviors();
		//function f2(){}
        //Backbone.eventsOnlineMonitor.trigger('osm:offlineevent');
        //Backbone.eventsOnlineMonitor.trigger('osm:offlineevent');
        //start hb - might be moved outside OnlineMonitor
        //startHeartbeat();
	}

	//public behaviors
   	return {
        init: init,
        setState: setState,
        getState: getState
    };

});