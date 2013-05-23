
define([DQXSCRQ(), DQXSC("Framework"), DQXSC("Controls"), DQXSC("Msg"), DQXSC("SQL"), DQXSC("DocEl"), DQXSC("Popup"), DQXSC("Utils"), DQXSC("DataFetcher/DataFetchers"), DQXSC("QueryTable"), "MetaData", "MetaDataDynamic"],
    function (require, Framework, Controls, Msg, SQL, DocEl, Popup, DQX, DataFetcher, QueryTable, MetaData, MetaDataDynamic) {

        var VariantTableModule = {

            Instance: function (iPage, iFrame) {
                iFrame._tmp = 123;
                var that = Framework.ViewSet(iFrame, 'varianttable');
                that.myPage = iPage;
                that.registerView();




                that.createFramework = function () {

                    this.frameQueries = this.getFrame().addMemberFrame(Framework.FrameGroupTab('CatVariatQueries', 0.35))
                        .setMarginsIndividual(0, 5, 0, 0).setDisplayTitle('Query type').setFrameClassClient('DQXForm');

                    this.frameQueries.InsertIntroBox('Icons/Medium/VariantCatalogue.png', 'Text'/*DQX.Text('IntroCatVariation')*/, 'Doc/CatVariation/Help.htm');

                    this.frameQueryPopulation = this.frameQueries.addMemberFrame(Framework.FrameFinal('CatVariatQueryPopulation', 0.4))
                        .setDisplayTitle('By population').setMargins(0).setFrameClassClient('DQXForm').setAllowSmoothScrollY();

                    this.frameQueryGene = this.frameQueries.addMemberFrame(Framework.FrameFinal('CatVariatQueryGene', 0.4))
                        .setDisplayTitle('By gene').setMargins(10).setFrameClassClient('DQXForm').setAllowSmoothScrollY();

                    this.frameTable = that.getFrame().addMemberFrame(Framework.FrameFinal('table', 0.7))
                        .setMargins(0);

                    this.theTableFetcher = new DataFetcher.Table(serverUrl,
                        MetaData.database,
                        MetaData.tableSnpData);
                    this.theTableFetcher.showDownload = true;
                    this.theTableFetcher.positionField = "pos";

                };

                that.createPanels = function () {

                    this.createPanelPopQuery();
                    this.createPanelGeneQuery();

                    this.panelTable = QueryTable.Panel(this.frameTable, this.theTableFetcher, { leftfraction: 50 });
                    this.theTableFetcher.setSortOption(SQL.TableSort(['chrom', 'pos']), false);

                    //Listen and react to column header click messages
                    var msgIDClickHeader = { type: 'ClickHeader', id: this.panelTable.myBaseID };
                    Msg.listen("", msgIDClickHeader, $.proxy(this._onClickHeader, this));


                    var colinfo = this.theTableFetcher.addFetchColumn('snpid', 'String', "rgb(0,0,0)");
                    var comp = this.panelTable.myTable.addTableColumn(QueryTable.Column('SNP id', 'snpid', 0));
                    var msgID = { type: 'ClickSnpID', id: this.panelTable.myBaseID };
                    comp.makeHyperlinkCell(msgID, DQX.interpolate("Show [@snp] info card"));
                    Msg.listen("", msgID, $.proxy(this._onClickSnpID, this));

                    var colinfo = this.theTableFetcher.addFetchColumn('chrom', 'String', "rgb(0,0,0)");
                    var comp = this.panelTable.myTable.addTableColumn(QueryTable.Column('Chrom.', 'chrom', 1));

                    var colinfo = this.theTableFetcher.addFetchColumn('pos', 'Int', "rgb(0,0,0)");
                    var comp = this.panelTable.myTable.addTableColumn(QueryTable.Column('Position', 'pos', 1));
                    comp.makeHyperlinkHeader(msgIDClickHeader, 'Column information');
                    that.panelTable.myTable.addSortOption('Position', SQL.TableSort(['chrom', 'pos']));

                    $.each(MetaDataDynamic.snpFieldList, function (idx, fieldInfo) {
                        var colinfo = that.theTableFetcher.addFetchColumn(fieldInfo.id, fieldInfo.dataType.getDownloadType(), "rgb(0,0,0)");
                        var comp = that.panelTable.myTable.addTableColumn(QueryTable.Column(fieldInfo.shortName, fieldInfo.id, 1));
                        comp.customInfo = fieldInfo;
                        if (fieldInfo.dataType.getBackColorFunction())
                            comp.CellToColor = fieldInfo.dataType.getBackColorFunction();
                        comp.CellToText = fieldInfo.dataType.getTextConvertFunction();
                        comp.makeHyperlinkHeader(msgIDClickHeader, 'Column information');
                        that.panelTable.myTable.addSortOption(fieldInfo.name, SQL.TableSort([fieldInfo.id]));
                    });

                    //we start by defining a query that returns nothing
                    if (true) {
                        this.theTableFetcher.setUserQuery1(SQL.WhereClause.Trivial());
                        this.panelTable.myTable.setQuery(SQL.WhereClause.Trivial());
                        this.panelTable.myTable.render();
                        //this.panelTable.myTable.reLoadTable();
                    }

                    //Make sure that the query results are reset each time another type of query is chosen
                    Msg.listen('', { type: 'ChangeTab', id: 'CatVariatQueries' }, function () {
                        that.invalidateQuery();
                        if (that.frameQueryGene.isVisible())
                            that.updateGeneQuery();
                    });

                };

                //This function is called when the user clicks on a snp id
                that._onClickSnpID = function (scope, id) {
                    var snpid = this.panelTable.getTable().getCellValue(id, "snpid");
                    Msg.send({ type: 'ShowSNPPopup' }, snpid);
                }

                //This function is called when the user clicks on a link in a column header of the SNP query table
                that._onClickHeader = function (scope, id) {
                    var thecol = this.panelTable.getTable().findColumn(id);
                    title = 'Column "{id}"'.DQXformat({ id: thecol.myName.replace('<br>', ' ') });
                    var content = "";
                    if (thecol.customInfo) {
                        content += '<br><b>' + thecol.customInfo.name + '</b><br><br>';
                        if ('createCustomInfo' in thecol.customInfo)
                            content += thecol.customInfo.createCustomInfo() + '<br><br>';
                    }
                    var buttons = [];
                    if (thecol.sortOption) {
                        buttons.push(Controls.Button(null, { buttonClass: 'DQXToolButton2', content: "Sort by<br>increasing value", bitmap: DQXBMP('arrow4down.png'), width: 120, height: 50 })
                            .setOnChanged(function () {
                                that.panelTable.getTable().sortByColumn(id, false);
                                if (!Popup.isPinned(popupID))
                                    DQX.ClosePopup(popupID);
                            }));
                        buttons.push(Controls.Button(null, { buttonClass: 'DQXToolButton2', content: "Sort by<br>decreasing value", bitmap: DQXBMP('arrow4up.png'), width: 120, height: 50 })
                            .setOnChanged(function () {
                                that.panelTable.getTable().sortByColumn(id, true);
                                if (!Popup.isPinned(popupID))
                                    DQX.ClosePopup(popupID);
                            }));
                    }
                    if (thecol.linkFunction) {
                        buttons.push(Controls.Button(null, { buttonClass: 'DQXToolButton2', content: thecol.linkHint, width: 170, height: 50 })
                            .setOnChanged(function () {
                                thecol.linkFunction(id);
                                if (!Popup.isPinned(popupID))
                                    DQX.ClosePopup(popupID);
                            }));
                    }

                    $.each(buttons, function (idx, bt) { content += bt.renderHtml(); });
                    var popupID = Popup.create(title, content);
                };

                that.createUpdateQueryButton = function (buttonID) {
                    return Controls.Button(buttonID, { buttonClass: 'DQXToolButton1', content: '<IMG style="float:left" SRC="Bitmaps/update1.png" border=0  ALT="Update"></IMG><span style="line-height:30px">Update query results</span>' });
                };

                //Call this function to invalidate the current table content
                that.invalidateQuery = function () {
                    this.panelTable.getTable().invalidate();
                    this.setCurrentQuery(null);
                };

                //Call this function to set a new query
                that.setCurrentQuery = function (qry) {
                    if ((qry != null) || (this.currentQuery != null)) {
                        this.currentQuery = qry;
                        Msg.broadcast({ type: 'ModifyCatVariatQuery' }, qry);
                    }
                };


                that.createPanelGeneQuery = function () {
                    this.panelPopGene = Framework.Form(this.frameQueryGene);
                    var theForm = this.panelPopGene;

                    var bt = Controls.Button('CatVariatQueryGeneFindGene', { buttonClass: 'DQXToolButton1', bitmap: 'Bitmaps/Icons/Small/MagGlassG.png', width: 210, height: 36, content: "Select gene to display [@snps] for..." })
                        .setOnChanged(this.promptGene);

                    this.frameQueryGene.activeGene = Controls.Html('CatVariatQueryGeneActiveGene', '<i>There is currently no gene selected</i>');
                    theForm.addControl(Controls.CompoundVert([bt, this.frameQueryGene.activeGene]));

                    theForm.render();
                };

                that.promptGene = function () {
                    require("Wizards/WizardFindGene").execute(function () {
                        that.activateGene(WizardFindGene.resultGeneID);
                    });
                };

                //Call this function to activate the variant catalog panel, and show SNPs for a specific gene
                that.activateGene = function (geneid) {
                    this.activateState();
                    this.frameQueryGene.makeVisible();
                    this.frameQueryGene.geneid = geneid;
                    this.updateGeneQuery();
                }

                that.updateGeneQuery = function (data) {
                    if (!this.frameQueryGene.geneid) return;
                    var geneid = this.frameQueryGene.geneid;
                    //fetch the full gene data
                    var myurl = DQX.Url(serverUrl);
                    myurl.addUrlQueryItem("datatype", 'recordinfo');
                    myurl.addUrlQueryItem("qry", SQL.WhereClause.encode(SQL.WhereClause.CompareFixed('fid', '=', geneid)));
                    myurl.addUrlQueryItem("database", MetaData.database);
                    myurl.addUrlQueryItem("tbname", MetaData.tableAnnotation);
                    $.ajax({
                        url: myurl.toString(),
                        success: function (resp) {
                            DQX.stopProcessing();
                            var keylist = DQX.parseResponse(resp);
                            if ("Error" in keylist) {
                                alert(keylist.Error);
                                return;
                            }
                            that.respondUpdateGeneQuery(keylist.Data);
                        },
                        error: DQX.createMessageFailFunction()
                    });
                    DQX.setProcessing("Downloading...");
                };


                that.respondUpdateGeneQuery = function (data) {
                    var content = "<h2>Active gene: " + data.fname + "</h2><p/>";
                    content += data.chromid + ':' + data.fstart + '-' + data.fstop;
                    this.frameQueryGene.activeGene.modifyValue(content);


                    var thequery = SQL.WhereClause.AND();
                    thequery.addComponent(SQL.WhereClause.CompareFixed('chrom', '=', MetaData.annotationInvTranslateChromoId(data.chromid)));
                    thequery.addComponent(SQL.WhereClause.CompareFixed('pos', '>=', data.fstart));
                    thequery.addComponent(SQL.WhereClause.CompareFixed('pos', '<=', data.fstop));
                    this.panelTable.getTable().setQuery(thequery);
                    this.panelTable.getTable().reLoadTable();
                    //this.panelAdvancedQueryBuilder.setQuery(thequery);
                    this.setCurrentQuery(thequery);
                }


                //This function is called when the user runs a 'population' query
                that.updatePopQuery = function () {
                    var freqPrefix = 'freq' + '_';
                    var thequery = SQL.WhereClause.AND();

                    $.each(MetaDataDynamic.populations, function (idx, pop) {
                        var vlmin = parseFloat(pop.controlPopQueryMin.getValue());
                        if (vlmin > 0)
                            thequery.addComponent(SQL.WhereClause.CompareFixed(freqPrefix + pop.ID, '>=', vlmin));
                        var vlmax = parseFloat(pop.controlPopQueryMax.getValue());
                        if (vlmax < 1)
                            thequery.addComponent(SQL.WhereClause.CompareFixed(freqPrefix + pop.ID, '<=', vlmax));
                    });

                    if (thequery.getComponentCount() == 0)
                        thequery = SQL.WhereClause.Trivial();
                    this.panelTable.getTable().setQuery(thequery);
                    this.panelTable.getTable().reLoadTable();
                    //this.panelAdvancedQueryBuilder.setQuery(thequery);
                    this.setCurrentQuery(thequery);
                };


                that.createPanelPopQuery = function () {
                    var invalidatingList = [];
                    this.panelPopQuery = Framework.Form(this.frameQueryPopulation);
                    this.panelPopQuery.setPadding(10);
                    var theForm = this.panelPopQuery;

                    var edt = this.createUpdateQueryButton('CatVariatQueryPopulation_Update')
                        .setOnChanged($.proxy(this.updatePopQuery, this));
                    theForm.addControl(edt);

                    var groupPop = Controls.CompoundVert();
                    groupPop.setLegend('Population allele frequencies');
                    /*                    this.catVarQueryPopulationFreqType = Controls.Combo('CatVariatQueryPopulationFreqType', { label: 'Frequency type:', states: MetaData1.frequencyTypeList });
                    groupPop.addControl(this.catVarQueryPopulationFreqType);
                    invalidatingList.push(this.catVarQueryPopulationFreqType);*/
                    var table = Controls.CompoundGrid();
                    table.setItem(0, 1, Controls.Static('Min.'));
                    table.setItem(0, 2, Controls.Static('Max.'));
                    minFreqControlList = []; maxFreqControlList = [];
                    $.each(MetaDataDynamic.populations, function (idx, pop) {
                        var linkCtrl = Controls.LinkButton('', { smartLink: true, text: '' }).setOnChanged(function (id, theControl) {
                            Msg.send({ type: 'ShowPopulation' }, theControl.popID);
                        });
                        linkCtrl.popID = pop.ID;
                        var nameCtrl = Controls.Static(linkCtrl.renderHtml() + '&nbsp;<b>' + pop.Name + '</b> (' + pop.ID + ')');
                        table.setItem(1 + idx, 0, nameCtrl);
                        var edt = Controls.Edit('CatVariatQueryPopulationMin_' + pop.ID, { value: '0.0', size: 4 });
                        invalidatingList.push(edt); minFreqControlList.push(edt);
                        table.setItem(1 + idx, 1, (edt));
                        pop.controlPopQueryMin = edt;
                        var edt = Controls.Edit('CatVariatQueryPopulationMax_' + pop.ID, { value: '1.0', size: 4 });
                        invalidatingList.push(edt); maxFreqControlList.push(edt);
                        table.setItem(1 + idx, 2, (edt));
                        pop.controlPopQueryMax = edt;
                    });
                    groupPop.addControl(table);
                    theForm.addControl(groupPop);

                    //Set a highlight background color for active filter fields
                    var activeFilterColor = DQX.Color(1, 0.8, 0.4);
                    var invalidFilterColor = DQX.Color(1, 0.5, 0.5);
                    $.each(minFreqControlList, function (idx, edt) {
                        edt.addValueChangedListener(function (id, ctrl) {
                            var val = parseFloat(ctrl.getValue());
                            if ((val < 0) || (val > 1)) {
                                ctrl.setBackgroundColor(invalidFilterColor);
                                return;
                            }
                            if (val > 0)
                                ctrl.setBackgroundColor(activeFilterColor);
                            else
                                ctrl.setBackgroundColor(DQX.Color(1, 1, 1));
                        });
                    });
                    $.each(maxFreqControlList, function (idx, edt) {
                        edt.addValueChangedListener(function (id, ctrl) {
                            var val = parseFloat(ctrl.getValue());
                            if ((val < 0) || (val > 1)) {
                                ctrl.setBackgroundColor(invalidFilterColor);
                                return;
                            }
                            if (val < 1)
                                ctrl.setBackgroundColor(activeFilterColor);
                            else
                                ctrl.setBackgroundColor(DQX.Color(1, 1, 1));
                        });
                    });

                    //Introduce message handlers for all messages that should invalidate the query result (i.e. changes in the query parameters)
                    for (var i = 0; i < invalidatingList.length; i++)
                        invalidatingList[i].addValueChangedListener($.proxy(this.invalidateQuery, this));

                    theForm.render();
                };


                that.activateState = function () {
                    var tabswitched = that.myPage.frameVariantTable.makeVisible();
                };


                Msg.listen('', { type: 'ShowVariantTableGene' }, function (context, geneid) {
                    that.activateGene(geneid);
                });

                return that;
            }

        };



        return VariantTableModule;
    });
