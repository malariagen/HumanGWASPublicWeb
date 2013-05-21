define([DQXSCRQ(), DQXSC("SVG"), DQXSC("Framework"), DQXSC("Popup"), DQXSC("DocEl"), DQXSC("SQL"), DQXSC("Msg"), DQXSC("Controls"), DQXSC("Map"), DQXSC("DataFetcher/DataFetchers"), "MetaData", "MetaDataDynamic"],
    function (require, SVG, Framework, Popup, DocEl, SQL, Msg, Controls, Map, DataFetcher, MetaData, MetaDataDynamic) {

        var MapSNPFrequencies = {

            //Creates an instance of a class that manages this thing
            Instance: function (iPage, iFrame) {
                var that = Framework.ViewSet(iFrame, 'mapsnpfreq');
                that.myPage = iPage;
                that.registerView();

                that.createFramework = function () {
                    this.getFrame().makeGroupHor();
                    //this.getFrame().setSeparatorSize(bigSeparatorSize);

                    this.frameControls = this.getFrame().addMemberFrame(Framework.FrameFinal('', 0.35))
                        .setMargins(10).setFrameClass('DQXClient').setAllowScrollBars(true, true);

                    this.frameControls.InsertIntroBox('Icons/Medium/VariantFrequency.png', DQX.Text('IntroSNPFrequencies'), 'Doc/SNPFreqMap/Help.htm');

                    var frameRight = this.getFrame().addMemberFrame(Framework.FrameGroupVert('', 0.65))
                        .setMargins(0).setSeparatorSize(2);

                    this.frameChoice = frameRight.addMemberFrame(Framework.FrameFinal('', 0.5))
                        .setMargins(5).setAutoSize().setFrameClassClient('DQXButtonBar').setAllowScrollBars(false, false);

                    this.frameMap = frameRight.addMemberFrame(Framework.FrameFinal('', 0.6))
                        .setFrameClassClient('DQXDarkFrame').setMargins(0).setAllowScrollBars(false, false);

                    this.frameLegend = frameRight.addMemberFrame(Framework.FrameFinal('MapLegend', 0.4))
                        .setFrameClassClient('DQXButtonBar').setMargins(0).setAutoSize().setAllowScrollBars(false, false);
                }

                that.createPanels = function () {
                    this.myMap = Map.GMap(this.frameMap, Map.Coord(15, 0), 3);
                    pointset_inactive = Map.PointSet('SNPFreqSiteMapPointsInactive', this.myMap, 0, "Bitmaps/circle_blue_small.png");
                    pointset_active = Map.PointSet('SNPFreqSiteMapPointsActive', this.myMap, 0, "");
                    //Msg.listen('', { type: 'ClickMapPoint', id: pointset_inactive.myID }, that.myPage.reactSwitchToSite);
                    //Msg.listen('', { type: 'ClickMapPoint', id: pointset_active.myID }, that.myPage.reactSwitchToSite);

                    this.controlsPanel = Framework.Form(this.frameControls);
                    var group = Controls.CompoundVert([]);
                    group.addControl(Controls.Button("MapSNPFreqsSelectSNP", { buttonClass: 'DQXToolButton1', bitmap: 'Bitmaps/Icons/Small/MagGlassV.png', width: 210, height: 36, content: 'Select a [@snp] to display on the map...' }))
                        .setOnChanged($.proxy(this.promptSNP, this));

                    this.controlsPanel.SNPInfo = Controls.Html('MapSNPFreqsActiveSNPInfo', '<i>There is currently no [@snp] selected to be displayed</i>');
                    group.addControl(this.controlsPanel.SNPInfo);
                    this.controlsPanel.FreqInfo = Controls.Html('MapSNPFreqsActiveSNPFreqInfo', '');
                    group.addControl(this.controlsPanel.FreqInfo);
                    this.controlsPanel.addControl(group);
                    this.controlsPanel.render();

                    /*                    var freqtypelist = [];
                    $.each(MetaData1.frequencyTypeList, function (idx, tpe) {
                    if (tpe.showOnPieCharts)
                    freqtypelist.push(tpe);
                    });
                    this.panelChoice = Framework.Form(this.frameChoice);
                    this.freqTypeSelector = Controls.Combo('MapSnpFreqType', { label: 'Frequency type:', value: 'NRAF', states: freqtypelist })
                    .setOnChanged($.proxy(this.showInfo, this));
                    this.panelChoice.addControl(this.freqTypeSelector);
                    this.panelChoice.render();*/

                    this.panelLegend = Framework.Form(this.frameLegend);
                    this.legendContent = Controls.Html('MapLegendSNPFrequencies', '');
                    this.panelLegend.addControl(this.legendContent);
                    this.panelLegend.render();

                };


                that.promptSNP = function () {
                    require("Wizards/WizardFindSNP").execute(function () {
                        that.jumpSNP(WizardFindSNP.resultSnpID);
                    });
                };


                that._callbackShowSnpFrequencies = function (data) {
                    this.dataSnpInfo = data;
                    var content = '<h3>Active [@snp]: ' + data.snpid + '</h3><p>';
                    //content += Common.SnpData2InfoTable(data);
                    content += '<p/><div id="SNPMapFrequenciesTables">';
                    this.controlsPanel.SNPInfo.modifyValue(content);
                    //Common.SnpData2AlleleFrequenciesTable(data, $("#SNPMapFrequenciesTables"));
                    this.showInfo();
                    DQX.stopProcessing();
                };

                that.jumpSNP = function (snpid) {

                    this.getFrame().makeVisible();

                    this.dataSnpInfo = null;
                    this.dataSnpCountryFreqs = null;
                    this.hideInfo();

                    //Initiate the download of area frequencies
                    var dataFetcher = this.myPage.GenomeBrowserView.dataFetcherSNPs;
                    dataFetcher.fetchFullRecordInfo(
                        SQL.WhereClause.CompareFixed('snpid', '=', snpid),
                        $.proxy(that._callbackShowSnpFrequencies, that), DQX.createMessageFailFunction()
                    );
                    DQX.setProcessing("Downloading...");
                };



                that._createAreaPopup = function (pieInfo) {
                    var aggrID = pieInfo.id0;

                    tokens = {};
                    tokens[DQX.interpolate('Population')] = pieInfo.name;
                    tokens['Non-ref allele frequency'] = pieInfo.frac.toFixed(3);
                    var content = '';
                    content += DQX.CreateKeyValueTable(tokens);

                    content += '<p/>';
                    content += pieInfo.count + ' samples for this population were collected by the following [@' + DQX.pluralise('study', pieInfo.pop.studies.length) + ']:';
                    $.each(pieInfo.pop.studies, function (idx, study) {
                        content += '<p>';
                        var ctrl = Controls.LinkButton('', { smartLink: true, text: study.Title });
                        ctrl.study = study;
                        ctrl.setOnChanged(function (id, theControl) {
                            Popup.closeUnPinnedPopups();
                            Msg.send({ type: 'ShowStudy' }, theControl.study.ID);
                        });
                        content += ctrl.renderHtml();
                    });


                    var popupID = Popup.create("Allele frequency", content);
                };


                that.createLegend = function () {
                    var groupColors = [DQX.Color(0, 0, 1), DQX.Color(1, 0, 0)];
                    groupNames = ['Reference allele', 'Non-reference allele'];
                    content = '<div class="MapLegend">';
                    for (var i = 0; i < groupNames.length; i++) {
                        content += DocEl.Span().setBackgroundColor(groupColors[i].toString()).addElem('&nbsp;&nbsp;&nbsp;&nbsp;').toString() + '&nbsp;';
                        content += groupNames[i];
                        content += '&nbsp;&nbsp; ';
                    }
                    content += '</div>';

                    this.legendContent.modifyValue(content);
                    this.panelLegend.render();
                }

                that.showInfo = function () {
                    this.hideInfo();
                    this.createLegend();
                    var mapObj = this.myMap;
                    var GMaps = require(DQXSC("Map"));
                    var freqList = [];

                    if (this.dataSnpInfo) {
                        $.each(MetaDataDynamic.populations, function (idx, pop) {
                            var item = {
                                tpe: -1,
                                id0: pop.ID,
                                id: pop.ID,
                                frac: parseFloat(that.dataSnpInfo["freq" + '_' + pop.ID]),
                                count: pop.sampleCount,
                                name: pop.Name,
                                centerLong: pop.centerLongit,
                                centerLatt: pop.centerLattit,
                                pop: pop
                            }
                            item.radius = 50.0 * Math.pow(item.count, 0.3);
                            freqList.push(item);
                        });
                    }

                    //sort from large to small so that smaller pie charts are nicely visible
                    freqList.sort(DQX.ByPropertyReverse('count'));

                    if (this.dataSnpInfo) {
                        var swapFreq = false;
                    }

                    var graphics = Map.MapItemLayouter(this.myMap, 'resistinfo');
                    for (var i = 0; i < freqList.length; i++) {
                        var item = freqList[i];
                        graphics.addItem(item.centerLong, item.centerLatt, item.radius);
                    }
                    graphics.calculatePositions();


                    for (var nr = 0; nr < freqList.length; nr++) {
                        var item = freqList[nr];
                        var chart = SVG.PieChart();
                        var radius = item.radius;
                        var freq = item.frac;
                        if (swapFreq) freq = 1 - freq;
                        /*                        if (this.freqTypeSelector.getValue() == 'MAF') {
                        if (freq > 0.5) freq = 1.0 - freq;
                        }*/
                        chart.addPart(1 - freq, DQX.Color(0, 0, 1), "R", item.name);
                        chart.addPart(freq, DQX.Color(1, 0, 0), "NR", item.name);

                        var pie = GMaps.Overlay.PieChart(mapObj, "MarkerFreq_" + item.ID,
                                GMaps.Coord(graphics.items[nr].longit2, graphics.items[nr].lattit2),
                                item.radius, chart);
                        pie.setOrigCoord(GMaps.Coord(item.centerLong, item.centerLatt));

//                        var pie = GMaps.Overlay.PieChart(mapObj, "GeoFreq_" + item.tpe + "_" + item.id, GMaps.Coord(item.centerLong, item.centerLatt), radius, chart);
                        pie.tpe = item.tpe;
                        pie.id0 = item.id0;
                        pie.id = item.id;
                        pie.name = item.name;
                        pie.frac = freq;
                        pie.count = item.count;
                        pie.pop = item.pop;
                        //pie.freqType = this.freqTypeSelector.getValue();
                        pie.onClick = $.proxy(that._createAreaPopup, that);
                    }

                };

                that.hideInfo = function () {
                    if (this.myMap) {
                        for (var i = 0; i < this.myMap.getOverlayCount(); ) {
                            if (this.myMap.getOverlay(i).myID.indexOf("GeoFreq") == 0)
                                this.myMap.removeOverlay(this.myMap.getOverlay(i).myID);
                            else
                                i++;
                        }
                    }
                };

                that.activateState = function () {
                    var tabswitched = this.frameControls.makeVisible();
                    this.showInfo();
                }

                Msg.listen('', { type: 'ShowAlleleFreqMap' }, function (context, snpid) {

                    that.getFrame().makeVisible();

                    that.dataSnpInfo = null;
                    that.dataSnpCountryFreqs = null;
                    that.hideInfo();

                    //Initiate the download of area frequencies
                    var dataFetcher = that.myPage.VariantTableView.theTableFetcher;
                    dataFetcher.fetchFullRecordInfo(
                        SQL.WhereClause.CompareFixed('snpid', '=', snpid),
                        $.proxy(that._callbackShowSnpFrequencies, that), DQX.createMessageFailFunction()
                    );
                    DQX.setProcessing("Downloading...");
                });

                return that;
            }

        };



        return MapSNPFrequencies;
    });