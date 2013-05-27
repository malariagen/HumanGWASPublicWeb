
define([DQXSCRQ(), DQXSC("Framework"), DQXSC("Controls"), DQXSC("Msg"), DQXSC("SQL"), DQXSC("DocEl"), DQXSC("Utils"), DQXSC("FrameList"), DQXSC("FrameTree"), DQXSC("ChannelPlot/GenomePlotter"), DQXSC("ChannelPlot/ChannelSequence"), DQXSC("ChannelPlot/ChannelSnps"), DQXSC("ChannelPlot/ChannelYVals"), DQXSC("DataFetcher/DataFetcherFile"), DQXSC("DataFetcher/DataFetchers"), DQXSC("DataFetcher/DataFetcherSummary"), "MetaData", "MetaDataDynamic", "GenomeBrowserSNPChannel"],
    function (require, Framework, Controls, Msg, SQL, DocEl, DQX, FrameList, FrameTree, GenomePlotter, ChannelSequence, ChannelSnps, ChannelYVals, DataFetcherFile, DataFetchers, DataFetcherSummary, MetaData, MetaDataDynamic, GenomeBrowserSNPChannel) {

        var GenomeBrowserModule = {

            Instance: function (iPage, iFrame) {
                iFrame._tmp = 123;
                var that = Framework.ViewSet(iFrame, 'genomebrowser');
                that.myPage = iPage;
                that.registerView();

                //List of components that can be drawn on the genome browser
                that.plotValues = MetaDataDynamic.genomePlotValues;
                $.each(that.plotValues, function (idx, plotValue) {
                    plotValue.hasFilterBank = true;
                    plotValue.color = DQX.Color(0, 0, 0.75);
                });

                //List of filterbanked summary elements to draw
                var summaryComps = [];
                summaryComps.push({ id: 'Max', color: DQX.Color(0.0, 0, 1.0), opacity: 1.0 });
                //                summaryComps.push({ id: 'Q99', color: DQX.Color(1.0, 0, 0.0), opacity: 0.35 });
                summaryComps.push({ id: 'Q95', color: DQX.Color(0.5, 0, 0.0), opacity: 0.35 });
                summaryComps.push({ id: 'Q50', color: DQX.Color(0.0, 0, 0.0), opacity: 0.35 });



                //List of components that can be drawn on the genome browser
                that.plotValues = MetaDataDynamic.genomePlotValues;
                $.each(that.plotValues, function (idx, plotValue) {
                    plotValue.hasFilterBank = true;
                    plotValue.color = DQX.Color(0, 0, 0.75);
                });

                that.createFramework = function () {
                    this.frameLeft = that.getFrame().addMemberFrame(Framework.FrameGroupVert('settings', 0.3))
                        .setMargins(0).setMinSize(Framework.dimX, 380);
                    this.frameLeft.InsertIntroBox('Icons/Medium/GenomeAccessibility.png', DQX.Text('IntroGenomeBrowser'), 'Doc/GenomeBrowser/Help.htm');
                    this.frameControls = this.frameLeft.addMemberFrame(Framework.FrameFinal('settings', 0.7))
                        .setMargins(0).setFixedSize(Framework.dimX, 380);
                    this.frameBrowser = that.getFrame().addMemberFrame(Framework.FrameFinal('browserPanel', 0.7))
                        .setMargins(0);

                    Msg.listen("", { type: 'JumpgenomeRegionGenomeBrowser' }, $.proxy(this.onJumpGenomeRegion, this));
                };

                that.createPanels = function () {

                    var browserConfig = {
                        serverURL: serverUrl,
                        chromoIdField: 'chrom', //set this to use chromosome id's
                        annotTableName: MetaData.tableAnnotation,
                        viewID: 'GenomeBrowser',
                        database: MetaData.database,
                        annotationChannelHeight: 100,
                        canZoomVert: true
                    };

                    //Intialise the form with the controls
                    this.panelControls = FrameTree.Tree(this.frameControls);

                    //Initialise the browser
                    this.panelBrowser = GenomePlotter.Panel(this.frameBrowser, browserConfig);
                    this.panelBrowser.getAnnotationFetcher().setFeatureType('gene', 'exon');
                    this.panelBrowser.getAnnotationChannel().setMinDrawZoomFactX(0.00005);
                    this.panelBrowser.MaxZoomFactX = 1.0 / 0.2;
                    this.panelBrowser.getNavigator().setMinScrollSize(0.0001);
                    this.panelBrowser.getNavigator().setUnits('Mb');
                    this.panelBrowser.getNavigator().zoomareafraction = 0.2;
                    this.panelBrowser.minZoomWindowSize = 20000;

                    this.panelBrowser.annotationChannel.handleFeatureClicked = function (geneID) {
                        Msg.send({ type: 'ShowGenePopup' }, geneID);
                    }


                    Msg.listen('', { type: 'ZoomFactorXChanged', id: this.panelBrowser.myID }, $.proxy(that.updateChannelVisibility, that));

                    //Annotation table has 'chrX' chromosome identifiers rather than numbers, so we translate them
                    this.panelBrowser.getAnnotationFetcher().translateChromoId = MetaData.annotationTranslateChromoId;

                    //Define the chromosomes
                    $.each(MetaData.chromosomes, function (idx, chromo) {
                        that.panelBrowser.addChromosome(chromo.id, chromo.id, chromo.len);
                    });

                    //Create data fetcher that will fetch the filterbanked data
                    this.dataFetcherProfiles = new DataFetcherSummary.Fetcher(serverUrl, 1000, 1200);
                    this.dataFetcherProfiles.translateChromoId = function (inp) { return 'chr' + parseInt(inp, 10); }
                    this.panelBrowser.addDataFetcher(this.dataFetcherProfiles);
                    this.summaryFolder = 'FilterBank';


                    this.createSNPChannels();

                    this.createProfileChannels();

                    //Causes the browser to start with a sensible start region
                    var firstChromosome = MetaData.chromosomes[0].id;
                    this.panelBrowser.setChromosome(firstChromosome, true, false);
                    this.panelBrowser.setPostInitialiseHandler(function () {
                        that.panelBrowser.showRegion(that.panelBrowser.getChromoID(1), 0, MetaData.chromosomes[0].len * 1E6);
                    });

                };


                that.updateChannelVisibility = function () { //updates the visibility status of the elements of the viewer
                    var zoomfact = this.panelBrowser.getZoomFactorX();
                    var showSNPPoints = (zoomfact >= 0.001);
                    if (true/*showSNPPoints != this.showSNPPoints*/) {
                        this.showSNPPoints = showSNPPoints;
                        $.each(that.plotValues, function (idx, plotValue) {
                            var theChannel = that.panelBrowser.findChannel(plotValue.id);
                            var isVisible = plotValue.visibilityCheckBox.getValue();
                            theChannel.modifyComponentActiveStatus(plotValue.id, isVisible && showSNPPoints);
                            if (plotValue.hasFilterBank) {
                                $.each(summaryComps, function (idx, summaryComp) {
                                    var summCompID = 'value_' + summaryComp.id;
                                    var summComp = theChannel.findComponent(summCompID);
                                    theChannel.modifyComponentActiveStatus(summComp.getID(), isVisible);
                                    summComp.setColor(summaryComp.color, summaryComp.opacity * (showSNPPoints ? 0.2 : 1));
                                });
                            }
                        });
                    }
                }


                //Create the channels that show information for each individual SNP
                that.createSNPChannels = function () {

                    //Create data fetcher that will fetch the SNP data
                    this.dataFetcherSNPs = new DataFetchers.Curve(
                        serverUrl,
                        MetaData.database,
                        MetaData.tableSnpData,
                        'pos'
                    );
                    this.dataFetcherSNPs.rangeExtension = 0.5; //fetch smaller range extension for speed reasons
                    this.panelBrowser.addDataFetcher(this.dataFetcherSNPs);

                    //                    require("Page").dataFetcherSNPs = this.dataFetcherSNPs; //Store this fetcher in a location accessible for everybody

                    this.channelSNPs = GenomeBrowserSNPChannel.SNPChannel(this.dataFetcherSNPs);
                    this.panelBrowser.addChannel(this.channelSNPs, false);


                    //Make sure we fetch the SNP id from the table
                    this.dataFetcherSNPs.addFetchColumn('snpid', "String");
                    this.dataFetcherSNPs.activateFetchColumn('snpid');

                    return;





                    var controlsList = []; //List of all controls that determine visibility of channels

                    //Draw all the plot values
                    $.each(that.plotValues, function (idx, plotValue) {

                        //Create a channel
                        var isPVal = plotValue.valueClass == '-log10';
                        var isBayesFactor = plotValue.valueClass == 'log10';
                        var scaleMin = 0;
                        var scaleMax = 1;
                        if (isPVal) { scaleMin = 0; scaleMax = 7; }
                        if (isBayesFactor) { scaleMin = -1; scaleMax = 7; }
                        var theChannel = ChannelYVals.Channel(plotValue.id, { minVal: scaleMin, maxVal: scaleMax });
                        theChannel.setTitle(plotValue.name);
                        theChannel.setHeight(200, true);
                        that.panelBrowser.addChannel(theChannel, false);

                        theChannel.setChangeYScale(false, true);

                        theChannel.postDraw = function (drawInfo) {
                            if (!that.showSNPPoints) {
                                drawInfo.centerContext.fillStyle = DQX.Color(0.3, 0.3, 0.3).toString();
                                drawInfo.centerContext.font = 'italic 15px sans-serif';
                                drawInfo.centerContext.textBaseline = 'top';
                                drawInfo.centerContext.textAlign = 'left';
                                drawInfo.centerContext.fillText('Zoom in to see individual SNP points', 8, 8);
                            }
                        }

                        //Attach a custom tooltip creation function to the channel
                        theChannel.getToolTipContent = function (compID, pointIndex) {
                            var value = this.myComponents[compID].myfetcher.getColumnPoint(pointIndex, compID);
                            if (value != null)
                                return that.dataFetcherSNPs.getColumnPoint(pointIndex, MetaData.databases.Analysis.tables.SNPInfo.snpIdColumn) + '; ' + compID + '= ' + value.toFixed(2);
                            else
                                return 'No value';
                        }

                        if (plotValue.hasFilterBank) {
                            //Filterbank summaries
                            $.each(summaryComps, function (idx, summaryComp) {
                                var summCompID = 'value_' + summaryComp.id;
                                var colinfo = that.dataFetcherProfiles.addFetchColumn(this.summaryFolder + '/' + plotValue.id, 'Summ01', summCompID);
                                var summComp = theChannel.addComponent(ChannelYVals.CompFilled(summCompID, that.dataFetcherProfiles, colinfo.myID));
                                summComp.setColor(summaryComp.color, summaryComp.opacity);
                                summComp.myPlotHints.makeDrawLines(3000000.0); //This causes the points to be connected with lines
                                summComp.myPlotHints.interruptLineAtAbsent = true;
                                summComp.myPlotHints.drawPoints = false;
                                theChannel.modifyComponentActiveStatus(summCompID, false, false);
                            });
                        }

                        //Individual SNP values
                        var colinfo = that.dataFetcherSNPs.addFetchColumn(plotValue.id, "Float2");
                        plotcomp = theChannel.addComponent(ChannelYVals.Comp(plotValue.id, that.dataFetcherSNPs, plotValue.id));
                        plotcomp.myPlotHints.color = plotValue.color;
                        plotcomp.myPlotHints.pointStyle = 1;
                        theChannel.modifyComponentActiveStatus(plotValue.id, false);
                        that.panelBrowser.channelModifyVisibility(theChannel.getID(), plotValue.defaultVisible);

                        //create a checkbox controlling the visibility of this component
                        var colorIndicator = Controls.Static('<span style="background-color:{color}">&nbsp;&nbsp;&nbsp;</span>&nbsp;'.DQXformat({ color: plotValue.color.toString() }));
                        var chk = Controls.Check('', { label: plotValue.name, value: plotValue.defaultVisible });
                        chk.setOnChanged(function () {
                            that.panelBrowser.channelModifyVisibility(theChannel.getID(), chk.getValue());
                            that.updateChannelVisibility();
                            that.panelBrowser.render();
                        });
                        plotValue.visibilityCheckBox = chk;
                        chk.propertyClass = plotValue.propertyClass;
                        controlsList.push(chk);

                        theChannel.handlePointClicked = function (compID, pointIndex) {
                            var snpid = that.dataFetcherSNPs.getColumnPoint(pointIndex, MetaData.databases.Analysis.tables.SNPInfo.snpIdColumn);
                            Msg.send({ type: 'ShowSNPPopup' }, snpid);
                        }

                    });


                    //Add the checkboxes that control the visibility of the components
                    var propertyClassesMap = {}
                    $.each(controlsList, function (idx, control) {
                        if (!(control.propertyClass in propertyClassesMap)) {
                            propertyClassesMap[control.propertyClass] = that.panelControls.root.addItem(FrameTree.Branch('' + idx, DocEl.StyledText(control.propertyClass, 'DQXLarge'))).setCanSelect(false);
                        }
                        propertyClassesMap[control.propertyClass].addItem(FrameTree.Control(control));
                    });

                    //that.panelControls.addControl(Controls.CompoundVert(controlsList));
                    this.panelControls.render();

                }


                that.createProfileChannels = function () {

                    var profiles = [];
                    profiles.push({
                        channelID: 'variable2',
                        label: 'Overall fixed effects',
                        maxval: 6,
                        propertyClass: 'Pan-African effect'
                    });

                    var channelVisibilitySwitchList = [];

                    $.each(profiles, function (idx, profile) {
                        var channelID = profile.channelID;
                        var label = profile.label;
                        var defaultVisible = true;
                        var theChannel = ChannelYVals.Channel(channelID, { minVal: 0, maxVal: profile.maxval });
                        theChannel.propertyClass = profile.propertyClass;
                        channelVisibilitySwitchList.push(theChannel);
                        theChannel.setTitle(label);
                        theChannel.setHeight(200, true);
                        that.panelBrowser.addChannel(theChannel, false);
                        theChannel.setChangeYScale(false, true);
                        var summCompList = [];

                        var summCompID = 'value_' + 'Max';
                        var colinfo = that.dataFetcherProfiles.addFetchColumn(that.summaryFolder + '/' + channelID, 'Summ01', summCompID);
                        var summComp = theChannel.addComponent(ChannelYVals.CompFilled(summCompID, that.dataFetcherProfiles, colinfo.myID));
                        summCompList.push(summComp);
                        summComp.setColor(DQX.Color(0, 0, 1), 0.8);
                        summComp.myPlotHints.makeDrawLines(3000000.0); //This causes the points to be connected with lines
                        summComp.myPlotHints.interruptLineAtAbsent = true;
                        summComp.myPlotHints.drawPoints = false;
                        theChannel.modifyComponentActiveStatus(summCompID, defaultVisible, false);

                        var summCompID = 'value_' + 'Q95';
                        var colinfo = that.dataFetcherProfiles.addFetchColumn(that.summaryFolder + '/' + channelID, 'Summ01', summCompID);
                        var summComp = theChannel.addComponent(ChannelYVals.CompFilled(summCompID, that.dataFetcherProfiles, colinfo.myID));
                        summCompList.push(summComp);
                        summComp.setColor(DQX.Color(1, 0, 0), 0.25);
                        summComp.myPlotHints.makeDrawLines(3000000.0); //This causes the points to be connected with lines
                        summComp.myPlotHints.interruptLineAtAbsent = true;
                        summComp.myPlotHints.drawPoints = false;
                        theChannel.modifyComponentActiveStatus(summCompID, defaultVisible, false);
                    });


                    if (true) {//Create recombination rate channel
                        var channelID = 'RecombinationRate';
                        var label = 'Recombination rate';
                        var defaultVisible = true;
                        var theChannel = ChannelYVals.Channel(channelID, { minVal: 0, maxVal: 100 });
                        theChannel.propertyClass = 'Misc';
                        channelVisibilitySwitchList.push(theChannel);
                        theChannel.setTitle(label);
                        theChannel.setHeight(200, true);
                        that.panelBrowser.addChannel(theChannel, false);
                        theChannel.setChangeYScale(false, true);
                        var summCompList = [];

                        var summCompID = 'value_' + 'Max';
                        var colinfo = that.dataFetcherProfiles.addFetchColumn(this.summaryFolder + '/' + channelID, 'Summ01', summCompID);
                        var summComp = theChannel.addComponent(ChannelYVals.CompFilled(summCompID, that.dataFetcherProfiles, colinfo.myID));
                        summCompList.push(summComp);
                        summComp.setColor(DQX.Color(0, 0, 0), 0.35);
                        summComp.myPlotHints.makeDrawLines(3000000.0); //This causes the points to be connected with lines
                        summComp.myPlotHints.interruptLineAtAbsent = true;
                        summComp.myPlotHints.drawPoints = false;
                        theChannel.modifyComponentActiveStatus(summCompID, defaultVisible, false);

                        var summCompID = 'value_' + 'Q50';
                        var colinfo = that.dataFetcherProfiles.addFetchColumn(this.summaryFolder + '/' + channelID, 'Summ01', summCompID);
                        var summComp = theChannel.addComponent(ChannelYVals.CompFilled(summCompID, that.dataFetcherProfiles, colinfo.myID));
                        summCompList.push(summComp);
                        summComp.setColor(DQX.Color(0.0, 0, 0), 0.75);
                        summComp.myPlotHints.makeDrawLines(3000000.0); //This causes the points to be connected with lines
                        summComp.myPlotHints.interruptLineAtAbsent = true;
                        summComp.myPlotHints.drawPoints = false;
                        theChannel.modifyComponentActiveStatus(summCompID, defaultVisible, false);

                    }

                    var controlsList = [];
                    $.each(channelVisibilitySwitchList, function (idx, theChannel) {
                        var chk = Controls.Check('', { label: theChannel.getTitle(), value: true });
                        chk.setOnChanged(function () {
                            that.panelBrowser.channelModifyVisibility(theChannel.getID(), chk.getValue());
                            $.each(theChannel.getComponentList(), function (idx2, component) {
                                component.modifyComponentActiveStatus(chk.getValue());
                            });
                            that.panelBrowser.render();
                        });
                        chk.propertyClass = theChannel.propertyClass;
                        controlsList.push(chk);
                    });

                    //Add the checkboxes that control the visibility of the components
                    var propertyClassesMap = {}
                    $.each(controlsList, function (idx, control) {
                        if (!(control.propertyClass in propertyClassesMap)) {
                            propertyClassesMap[control.propertyClass] = that.panelControls.root.addItem(FrameTree.Branch('' + idx, DocEl.StyledText(control.propertyClass, 'DQXLarge'))).setCanSelect(false);
                        }
                        propertyClassesMap[control.propertyClass].addItem(FrameTree.Control(control));
                    });
                    this.panelControls.render();

                }





                //Call this function to jump to & highlight a specific region on the genome
                that.onJumpGenomeRegion = function (context, args) {
                    this.activateState();
                    if ('chromoID' in args)
                        var chromoID = args.chromoID;
                    else {
                        DQX.assertPresence(args, 'chromNr');
                        var chromoID = this.panelBrowser.getChromoID(args.chromNr);
                    }
                    DQX.assertPresence(args, 'start'); DQX.assertPresence(args, 'end');
                    this.panelBrowser.highlightRegion(chromoID, (args.start + args.end) / 2, args.end - args.start);
                };


                that.activateState = function () {
                    var tabswitched = that.myPage.frameGenomeBrowser.makeVisible();
                };

                return that;
            }

        };

        return GenomeBrowserModule;
    });
