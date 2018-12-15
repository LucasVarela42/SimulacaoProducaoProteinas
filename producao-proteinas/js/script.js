"use strict";
//instancias
var stats = new Stats();
// Datasources
NGL.cssDirectory = "css/";
NGL.DatasourceRegistry.add("data", new NGL.StaticDatasource("../models/molecules/"));
var mdsrv = NGL.getQuery("mdsrv");
if (mdsrv) {
    var mdsrvDatasource = new NGL.MdsrvDatasource(mdsrv);
    NGL.DatasourceRegistry.add("file", mdsrvDatasource);
    NGL.setListingDatasource(mdsrvDatasource);
    NGL.setTrajectoryDatasource(mdsrvDatasource);
}
var stage = new NGL.Stage();

function init() {
    //estatistica do fps
    //stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
    //stage.viewer.container.appendChild(stats.dom);
    
    NGL.StageWidget(stage)
    
    var load = NGL.getQuery("load")
    if (load) stage.loadFile(load).then(function (o) {
        o.addRepresentation("ball+stick");
        o.autoView();
      });
}

window.onload = init();