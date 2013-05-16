
define([DQXSCRQ(), DQXSC("Framework"), DQXSC("Controls"), DQXSC("Msg"), DQXSC("SQL"), DQXSC("DocEl"), DQXSC("Popup"), DQXSC("Utils"), DQXSC("DataFetcher/DataFetchers"), DQXSC("QueryTable"), "MetaData", "MetaDataDynamic"],
    function (require, Framework, Controls, Msg, SQL, DocEl, Popup, DQX, DataFetcher, QueryTable, MetaData, MetaDataDynamic) {

        var VariantTableModule = {

            Instance: function (iPage, iFrame) {
                iFrame._tmp = 123;
                var that = Framework.ViewSet(iFrame, 'varianttable');
                that.myPage = iPage;
                that.registerView();




                that.createFramework = function () {
                    this.frameLeft = that.getFrame().addMemberFrame(Framework.FrameGroupVert('settings', 0.3))
                        .setMargins(0).setMinSize(Framework.dimX, 380);
                    this.frameControls = this.frameLeft.addMemberFrame(Framework.FrameFinal('settings', 0.7))
                        .setMargins(0).setDisplayTitle('Settings').setFixedSize(Framework.dimX, 380);
                    this.frameTable = that.getFrame().addMemberFrame(Framework.FrameFinal('table', 0.7))
                        .setMargins(0).setDisplayTitle('Table');
                };

                that.createPanels = function () {
                    this.theTableFetcher = new DataFetcher.Table(serverUrl,
                        MetaData.database,
                        MetaData.tableSnpData);
                    this.theTableFetcher.showDownload = true;
                    this.theTableFetcher.positionField = "pos";
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
                    this.theTableFetcher.setUserQuery1(SQL.WhereClause.Trivial());
                    this.panelTable.myTable.setQuery(SQL.WhereClause.Trivial());
                    this.panelTable.myTable.render();
                    this.panelTable.myTable.reLoadTable();

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
                    content = '<br><b>' + thecol.customInfo.name + '</b><br><br>';
                    if ('createCustomInfo' in thecol.customInfo)
                        content += thecol.customInfo.createCustomInfo() + '<br><br>';
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



                that.activateState = function () {
                    var tabswitched = that.myPage.frameVariantTable.makeVisible();
                };

                return that;
            }

        };

        return VariantTableModule;
    });
