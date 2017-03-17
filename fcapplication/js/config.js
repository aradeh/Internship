
var FCA_APP = {};

var PROD    = 'http://forestcarbonx.umn.edu/';
var DEV     = 'http://52.10.247.157/';

FCA_APP.SERVER      = PROD;
//FCA_APP.SERVER      = DEV;

var PROD_GEOSERVER  = FCA_APP.SERVER.slice(0,-1)+':8080/geoserver/ForestCarbon/';
var DEV_GEOSERVER   = FCA_APP.SERVER.slice(0,-1)+':8090/geoserver/ForestCarbon/';

FCA_APP.GEOSERVER   = PROD_GEOSERVER;
//FCA_APP.GEOSERVER   = DEV_GEOSERVER;
