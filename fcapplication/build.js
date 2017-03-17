({
// ISSUES include chart's different path in requireconfig -
//  because it is used in a define call in CDView
//  -- take out Chart, make global
//

    appDir:'.',
    dir: 'app-build',
    baseUrl:'js',
    mainConfigFile: 'js/requireconfig.js',
        /*
    paths: {
        jquery:     'libs/jquery/jquery',
        openlayers: 'libs/ol/ol',
        openlayersdebug: 'libs/ol/ol-debug',
        bootstrap:  'libs/bootstrap/js/bootstrap',
        backbone: 'libs/backbone/backbone',
        underscore: 'libs/backbone/underscore',
        json2: 'libs/backbone/json2',
        chart: 'libs/chart/Chart',
        jquery:     'empty:',
        openlayers: 'empty:',
        openlayersdebug: 'empty:',
        bootstrap:  'empty:',
        underscore: 'empty:',
        json2: 'empty:',
        chart: 'empty:',
    },
    shim: {
        bootstrap: {
            deps: ['jquery']
        },
        backbone: {
            deps: ['jquery','underscore'],
            exports: 'Backbone'
        },
        underscore: {
            exports: '_'
        },
    },
        */
    
    name: "main",

    optimize: 'uglify2',
    
    //out: "MainOptimized.js"
})

/*({
    baseUrl:'js',
    mainConfigFile: 'js/requireconfig.js',
    paths: {
        jquery:     'empty:',
        openlayers: 'empty:',
        openlayersdebug: 'empty:',
        bootstrap:  'empty:',
        underscore: 'empty:',
        json2: 'empty:',
        chart: 'empty:',
    },
    name: "main",

    optimize: 'uglify2',
    
    dir: "out"

})
*/
