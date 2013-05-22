﻿define([DQXSCRQ(), DQXSC("Framework"), DQXSC("Controls"), DQXSC("Msg"), DQXSC("SQL"), DQXSC("DocEl"), DQXSC("Popup"), DQXSC("Wizard"), DQXSC("DataFetcher/DataFetchers"), "Wizards/FindGeneControl", "MetaData"],
    function (require, Framework, Controls, Msg, SQL, DocEl, Popup, Wizard, DataFetcher, FindGeneControl, MetaData) {
        WizardFindSNP = Wizard.Create("WizardFindSNP");


        WizardFindSNP._recentList = [];
        WizardFindSNP._currentSearchNr = 0;

        WizardFindSNP.addSNPHit = function (id) {
            var isPresent = false;
            for (var i = 0; i < WizardFindSNP._recentList.length; i++)
                if (WizardFindSNP._recentList[i] == id)
                    isPresent = true;
            if (!isPresent)
                WizardFindSNP._recentList.unshift(id);
        }


        WizardFindSNP.setResult = function (id) {
            WizardFindSNP.addSNPHit(id);
            WizardFindSNP.resultSnpID = id;
        }

        WizardFindSNP.setTitle("Find [@snp]");

        var searchOptions = [
            { id: 'FindByID', name: 'By rs ID' },
            { id: 'findByGeneStep1', name: 'By gene' },
            { id: 'FindByRegion', name: 'By genomic region' }
            ];
        var buttonList = [Controls.Static('Select a method to search for a [@snp]:').makeComment()];
        for (var i = 0; i < searchOptions.length; i++) {
            var bt = Controls.Button(searchOptions[i].id, { width: 500, content: searchOptions[i].name, fastTouch: true });
            bt.setOnChanged(function (id) {
                WizardFindSNP.jumpToPage(id);
            });
            buttonList.push(bt);
        }

        var controlList = [Controls.CompoundVert(buttonList), Controls.CompoundHor([])];

        WizardFindSNP.addPage({
            id: 'init',
            helpUrl: 'Doc/WizardFindSNP/Help.htm',
            form: Controls.CompoundVert(controlList),
            hideNext: true
        });


        ///////////////////////////////////////////////////////////////////////////////////////
        // Search Method: find by SNP identifier
        ///////////////////////////////////////////////////////////////////////////////////////

        WizardFindSNP.addPage({
            id: 'FindByID',
            helpUrl: 'Doc/WizardFindSNP/Help.htm',
            form: Controls.CompoundVert([
                Controls.Static('Enter a [@snp] identifier:').makeComment(),
                Controls.Edit('SNPID', { size: 30 }).setHasDefaultFocus(),
                Controls.Static(''),
                Controls.Static('About [@snp] identifiers<br>Each variant called in this data set is assigned a unique identifier composed of the chromosome and position (<b>chromosome:position</b>, e.g. MAL7:459003).').makeComment()
            ]),
            reportValidationError: function () {
                var snpid = WizardFindSNP.getPage('FindByID').form.findControl('SNPID').getValue();
                if (!snpid)
                    return "Please enter a [@snp] identifier";
            },
            onFinish: function () {
                WizardFindSNP.setResult(WizardFindSNP.getPage('FindByID').form.findControl('SNPID').getValue());
            }
        });


        ///////////////////////////////////////////////////////////////////////////////////////
        // Search method: find by gene
        ///////////////////////////////////////////////////////////////////////////////////////

        //Page: find by gene part 1
        WizardFindSNP.findGene = FindGeneControl.Instance('FindSNPByGene', {
            database: MetaData.database,
            annotationTableName: MetaData.tableAnnotation,
            notifyEnter: function () {
                if (WizardFindSNP.findGene.getHasValidGeneList())
                    WizardFindSNP._onNext()
            }
        });
        WizardFindSNP.findGene.setHasDefaultFocus();
        WizardFindSNP.addPage({
            id: 'findByGeneStep1',
            helpUrl: 'Doc/WizardFindSNP/Help.htm',
            form: Controls.CompoundVert([
                Controls.Static("<b>STEP 1: select the gene that contains the [@snp]:</b>"),
                WizardFindSNP.findGene
            ]),
            reportValidationError: function () {
                if (!WizardFindSNP.findGene.getValue()) return "There is no gene selected";
            },
            getNextPage: function () {
                return 'findByGeneStep2';
            }
        });

        //Page: find by gene part 2
        WizardFindSNP.resultListSNPInGene = Controls.List('SNPInGeneList', { width: -1, height: 300 });
        WizardFindSNP.addPage({
            id: 'findByGeneStep2',
            helpUrl: 'Doc/WizardFindSNP/Help.htm',
            form: Controls.CompoundVert([
                Controls.Static('<b>STEP 2: select a [@snp] from the list of [@snps] in called this gene:</b>'),
                WizardFindSNP.resultListSNPInGene
            ]),
            reportValidationError: function () {
                if (!WizardFindSNP.resultListSNPInGene.getValue()) return "There is no [@snp] selected";
            },
            onStart: function () { WizardFindSNP.loadGeneSNPList(WizardFindSNP.findGene.getGeneName(),WizardFindSNP.findGene.getGeneChromID(),WizardFindSNP.findGene.getGeneStartPos(), WizardFindSNP.findGene.getGeneStopPos()); },
            onFinish: function () {
                WizardFindSNP.setResult(WizardFindSNP.mapSNPIDByGene[WizardFindSNP.resultListSNPInGene.getValue()]);
            }
        });

        WizardFindSNP._respond_loadGeneSNPList = function (geneid, data) {
            if (data.snpid.length == 0) {
                WizardFindSNP.resultListSNPInGene.getJQElement('').html(DQX.interpolate('<i>There are no [@snps] reported in this gene</i>'));
            }
            else {
                var items = [];
                WizardFindSNP.mapSNPIDByGene = {};
                for (var i = 0; i < data.snpid.length; i++) {
                    items.push({
                        id: 'id' + i,
                        content: '{geneid}, {id}'.DQXformat({ geneid: geneid, id: data.snpid[i] })
                    });
                    WizardFindSNP.mapSNPIDByGene['id' + i] = data.snpid[i];
                }
                WizardFindSNP.resultListSNPInGene.setItems(items, 'id0');
            }
            DQX.stopProcessing();
        }

        WizardFindSNP.loadGeneSNPList = function (geneid,chromID,startPos,stopPos) {
            WizardFindSNP.resultListSNPInGene.setItems([], '');
            var whc = SQL.WhereClause.AND([
                SQL.WhereClause.CompareFixed('chrom', '=', MetaData.annotationInvTranslateChromoId(chromID)),
                SQL.WhereClause.CompareFixed('pos', '>=', startPos),
                SQL.WhereClause.CompareFixed('pos', '<=', stopPos),
            ]);
            var fetcher = DataFetcher.RecordsetFetcher(serverUrl, MetaData.database, MetaData.tableSnpData);
            fetcher.setMaxResultCount(1001);
            fetcher.addColumn('snpid', 'ST');
            DQX.setProcessing("Downloading...");
            fetcher.getData(whc, "pos",
                function (data) { WizardFindSNP._respond_loadGeneSNPList(geneid, data) },
                DQX.createMessageFailFunction()
            );
        }


        ///////////////////////////////////////////////////////////////////////////////////////
        // Method: find by genome region
        ///////////////////////////////////////////////////////////////////////////////////////

        var chromlist = [];
        $.each(MetaData.chromosomes, function (idx, chrom) {
            chromlist.push({ id: chrom.id, name: chrom.name });
        });
        WizardFindSNP.searchChromosome = Controls.Combo('SearchRegionChromosome', { label: 'Chromosome:', value: '', states: chromlist }).setHasDefaultFocus();
        WizardFindSNP.searchStart = Controls.Edit('SearchRegionStart', { size: 10 });
        WizardFindSNP.searchEnd = Controls.Edit('SearchRegionEnd', { size: 10 });
        var handleModifiedStart = function () { WizardFindSNP.handleModifiedStart(); };
        var handleFindRegion = function () { WizardFindSNP.findSNPsInRegion(); };
        WizardFindSNP.searchChromosome.setOnChanged(handleFindRegion);
        WizardFindSNP.searchStart.setOnChanged(handleModifiedStart);
        WizardFindSNP.searchEnd.setOnChanged(handleFindRegion);
        WizardFindSNP.resultList_Region = Controls.List('SearchResultListRegion', { width: -1, height: 270 });
        WizardFindSNP.searchRegionStatus = Controls.Html('SearchRegionStatus', '');
        WizardFindSNP.addPage({
            id: 'FindByRegion',
            helpUrl: 'Doc/WizardFindSNP/Help.htm',
            form: Controls.CompoundVert([
                Controls.Static('Select a genomic region:').makeComment(),
                Controls.CompoundHor([
                    WizardFindSNP.searchChromosome,
                    Controls.Static('&nbsp;&nbsp;&nbsp; Start:&nbsp;'),
                    WizardFindSNP.searchStart,
                    Controls.Static('&nbsp;bp'),
                    Controls.Static('&nbsp;&nbsp;&nbsp; End:&nbsp;'),
                    WizardFindSNP.searchEnd,
                    Controls.Static('&nbsp;bp')
                ]),
                Controls.Static('<br>Select a [@snp] from the list of matches:').makeComment(),
                WizardFindSNP.resultList_Region,
                WizardFindSNP.searchRegionStatus
            ]),
            reportValidationError: function () {
                if (!WizardFindSNP.resultList_Region.getValue())
                    return "There is no [@snp] selected";
            },
            onFinish: function () {
                WizardFindSNP.setResult(WizardFindSNP.findRegionIDMap[WizardFindSNP.resultList_Region.getValue()]);
            }
        });

        WizardFindSNP.setSearchResultMessage_Region = function (msg) {
            WizardFindSNP.resultList_Region.getJQElement('').html(DQX.interpolate('<i> ' + msg + '</i>'));
        }

        WizardFindSNP._respond_findSNPsInRegion = function (data) {
            if (data.snpid.length == 0) {
                WizardFindSNP.setSearchResultMessage_Region('No [@snps] found in the selected region');
                return;
            }
            var items = [];
            WizardFindSNP.findRegionIDMap = {};
            for (var i = 0; i < data.snpid.length; i++) {
                var descr = '{id}'.DQXformat({ id: data.snpid[i] });
                items.push({ id: 'id' + i, content: descr });
                WizardFindSNP.findRegionIDMap['id' + i] = data.snpid[i];
            }
            WizardFindSNP.resultList_Region.setItems(items, 'id0');
            if (data.snpid.length > 500)
                WizardFindSNP.searchRegionStatus.modifyValue('<i>Result set limited to the first 500 hits</i>');
            else
                WizardFindSNP.searchRegionStatus.modifyValue('');
        }

        WizardFindSNP.handleModifiedStart = function () {
            var str_start = WizardFindSNP.searchStart.getValue();
            var str_stop = WizardFindSNP.searchEnd.getValue();
            if (str_start) {
                var val_start = parseInt(str_start);
                if (val_start > 0) {
                    var val_stop = parseInt(str_stop);
                    if ((!val_stop) || (val_stop < val_start))
                        WizardFindSNP.searchEnd.modifyValue(str_start);
                    else
                        WizardFindSNP.findSNPsInRegion();
                }
            }
        }

        WizardFindSNP.findSNPsInRegion = function () {
            WizardFindSNP._currentSearchNr++;
            var thisSearchNr = WizardFindSNP._currentSearchNr;
            WizardFindSNP.resultList_Region.setItems([], '');
            var chromid = WizardFindSNP.searchChromosome.getValue();
            var str_start = WizardFindSNP.searchStart.getValue();
            var str_stop = WizardFindSNP.searchEnd.getValue();
            if (str_start && str_stop) {
                var val_start = parseInt(str_start);
                var val_stop = parseInt(str_stop);
                WizardFindSNP.setSearchResultMessage_Region('Fetching search hits...');
                var whc = SQL.WhereClause.AND([
                    SQL.WhereClause.CompareFixed('chrom', '=', chromid),
                    SQL.WhereClause.CompareFixed('pos', '>=', str_start),
                    SQL.WhereClause.CompareFixed('pos', '<=', str_stop),
                ]);
                var fetcher = DataFetcher.RecordsetFetcher(serverUrl, MetaData.database, MetaData.tableSnpData);
                fetcher.setMaxResultCount(501);
                fetcher.addColumn('snpid', 'ST');
                fetcher.getData(whc, "snpid",
                    function (data) {
                        if (thisSearchNr == WizardFindSNP._currentSearchNr)
                            WizardFindSNP._respond_findSNPsInRegion(data)
                    },
                    DQX.createMessageFailFunction()
                );
            }
        }






        WizardFindSNP.initialise = function () {
        }

        ////////////// Execute the wizard /////////////////////////////

        WizardFindSNP.execute = function (retFunction) {
            if (!WizardFindSNP.started) {
                WizardFindSNP.initialise();
                WizardFindSNP.started = true;
            }
            var recentList = WizardFindSNP.getPage('init').form._controls[1];
            recentList.clear();
            if (WizardFindSNP._recentList.length == 0)
                recentList.addControl(Controls.Static(""));
            else
                recentList.addControl(Controls.Static("<br/><br/>Recent hits:&nbsp;"));
            for (var i = 0; i < Math.min(10, WizardFindSNP._recentList.length); i++) {
                if (i > 0)
                    recentList.addControl(Controls.Static('&nbsp;&nbsp;&nbsp;'));
                var link = Controls.Hyperlink('RecentHit_' + i, { content: WizardFindSNP._recentList[i] });
                link.snpid = WizardFindSNP._recentList[i];
                link.setOnChanged(function () {
                    WizardFindSNP.setResult(this.snpid);
                    WizardFindSNP.performFinish();
                });
                recentList.addControl(link);
            }

            WizardFindSNP.run(retFunction);
        }

        WizardFindSNP.init = function () {
            Msg.listen('', { type: 'WizardFindSNP' }, function (context) {
                WizardFindSNP.execute(function () {
                    Msg.send({ type: 'ShowSNPPopup' }, WizardFindSNP.resultSnpID);
                });
            });
        }


        return WizardFindSNP;
    });

