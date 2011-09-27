var fs = require('fs');
var path = require('path');
var mapjs = require('../mapjs');
var Mapper = require('./map').Mapper;
var OutputCollector = require('../mapjs').OutputCollector;
var inherits = require('util').inherits;

function JobClient() {
}

inherits(JobClient, mapjs.JobClient);

exports.JobClient = JobClient;

JobClient.prototype.run = function(jobconf) {
    if(!jobconf.inputFormat) throw new Error('JobClient.run fail. No input format specified.');
    if(!jobconf.mapper) throw new Error('JobClient.run fail. No mapper specified.');
    if(!jobconf.reducer) throw new Error('JobClient.run fail. No reducer specified.');

    var mappers = this.generateMappers(jobconf);
    var intermediatePairs = new OutputCollector();

    for(var i = 0; i < mappers.length; ++i) {
        var outputCollector = new OutputCollector();
        mappers[i].map(outputCollector);
        intermediatePairs.join(outputCollector);
    }

    for(oc in outputCollector.splitByKeys()) {
        var resultOutputCollector;
        var reducer = jobconf.reducer.clone();
        reducer.outputCollector = oc;
        reducer.reduce(resultOutputCollector);
    }
};

JobClient.prototype.generateMappers = function(jobconf) {

    var inputFiles = fs.readdirSync(jobconf.inputPath);
    var inputSplits = [];
    var mappers = [];
    for(var i =0; i < inputFiles.length; ++i) {
        var absPath = path.join(jobconf.inputPath, inputFiles[i]);
        inputSplits = inputSplits.concat(jobconf.inputFormat.split(absPath));
    }

    for(var i = 0; i < inputSplits.length; ++i) {
        var mapper = jobconf.mapper.clone();
        mapper.value = inputSplits[i].value;
        mappers.push(mapper);
    }

    return mappers;
};