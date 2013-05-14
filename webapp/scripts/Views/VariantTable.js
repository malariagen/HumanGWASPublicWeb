
define([DQXSCRQ(), DQXSC("Framework"), DQXSC("Controls"), DQXSC("Msg"), DQXSC("SQL"), DQXSC("DocEl"), DQXSC("Utils"), DQXSC("DataFetcher/DataFetchers"), DQXSC("QueryTable"), "MetaData", "MetaDataDynamic"],
    function (require, Framework, Controls, Msg, SQL, DocEl, DQX, DataFetcher, QueryTable, MetaData, MetaDataDynamic) {

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
                        MetaData.databases.Analysis.url,
                        MetaData.databases.Analysis.tables.SNPDetails.tableName);
                    this.theTableFetcher.showDownload = true;
                    this.theTableFetcher.positionField = "position";
                    this.panelTable = QueryTable.Panel(this.frameTable, this.theTableFetcher, { leftfraction: 50 });

                    var colinfo = this.theTableFetcher.addFetchColumn('rsid', 'String', "rgb(0,0,0)");
                    var comp = this.panelTable.myTable.addTableColumn(QueryTable.Column('rsid', 'rsid', 0));

                    //we start by defining a query that returns nothing
                    this.theTableFetcher.setUserQuery1(SQL.WhereClause.Trivial());
                    this.panelTable.myTable.setQuery(SQL.WhereClause.Trivial());
                    this.panelTable.myTable.render();
                    this.panelTable.myTable.reLoadTable();

                };




                that.activateState = function () {
                    var tabswitched = that.myPage.frameVariantTable.makeVisible();
                };

                return that;
            }

        };

        return VariantTableModule;
    });
