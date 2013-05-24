define(
    [DQXSCRQ(), DQXSC("Framework"), DQXSC("Msg"), DQXSC("SQL"), DQXSC("DocEl"), DQXSC("Popup"), DQXSC("PopupFrame"), DQXSC("Controls"), DQXSC("DataFetcher/DataFetchers"),
    "MetaData", "MetaDataDynamic"],
    function (require, Framework, Msg, SQL, DocEl, Popup, PopupFrame, Controls, DataFetchers, MetaData, MetaDataDynamic) {


        var ShowSNPPopup = {}


        var renderValueBar = function (frac, fracStyle) {
            var frac = Math.min(1, frac);
            var rs = '';
            if (frac > 0.01)
                rs += '<div class="{fracStyle}" style="height:10px;width:{prc}%;overflow:visible;padding-top:2px;padding-bottom:2px">'.DQXformat({ prc: 100 * frac, fracStyle: fracStyle });
            if (frac > 0.01)
                rs += '<div>';
            return rs;
        }


        ShowSNPPopup.createPopup = function (data) {
            var snpid = data.snpid;
            var content = '';

            content += '<table class="DQXStyledTable" style="background-color:white"><tr><th>Population</th><th>Allele frequency</th><th>Graph<div style="width:200px"><div></th></tr>';
            $.each(MetaDataDynamic.populations, function (idx, pop) {
                content += '<tr>';
                content += '<td>';
                content += pop.getControl().renderHtml();
                content += '</td>';
                content += "<td style='background-color:" + MetaDataDynamic.funcFraction2Color(data['freq' + '_' + pop.ID]) + "'>";
                var frac = data['freq' + '_' + pop.ID];
                content += MetaDataDynamic.funcFraction2Text(frac);
                content += '</td>';
                content += '<td>';
                if (frac) {
                    content += renderValueBar(frac, 'FracBar');
                }
                content += '</td>';
                content += '</tr>';
            });
            content += '</table><p>';

            //Allele frequencies button
            var args = { buttonClass: 'DQXToolButton2', content: "Show frequencies on map", width: 150, height: 51 }
            args.bitmap = "Bitmaps/{bmp}".DQXformat({ bmp: "Icons/Medium/VariantFrequency.png" });
            var bt = Controls.Button(null, args);
            bt.setOnChanged(function () {
                Popup.closeIfNeeded(popupID);
                Msg.send({ type: 'ShowAlleleFreqMap' }, snpid);
            });
            content += bt.renderHtml();

            //Genome browser button
            var args = { buttonClass: 'DQXToolButton2', content: "Show position on genome", width: 150, height: 51 }
            args.bitmap = "Bitmaps/{bmp}".DQXformat({ bmp: "Icons/Medium/GenomeAccessibility.png" });
            var bt = Controls.Button(null, args);
            bt.setOnChanged(function () {
                Popup.closeIfNeeded(popupID);
                Msg.send({ type: 'JumpgenomeRegionGenomeBrowser' }, { chromoID: data.chrom, start: parseInt(data.pos), end: parseInt(data.pos) });
            });
            content += bt.renderHtml();


            var popupID = Popup.create("[@Snp] " + snpid, content);
        }

        ShowSNPPopup.handlePopup = function (snpid) {
            var dataFetcher = ShowSNPPopup.dataFetcherSNPDetails;
            dataFetcher.fetchFullRecordInfo(
                SQL.WhereClause.CompareFixed("snpid", '=', snpid),
                function (data) {
                    DQX.stopProcessing();
                    ShowSNPPopup.createPopup(data);
                },
                function (msg) {
                    DQX.stopProcessing();
                    alert('Invalid SNP id: ' + snpid);
                }
                );
            DQX.setProcessing("Downloading...");
        }

        ShowSNPPopup.init = function () {
            ShowSNPPopup.dataFetcherSNPDetails = new DataFetchers.Curve(serverUrl, MetaData.database, MetaData.tableSnpData, "pos");

            //Create event listener for actions to open a SNP popup window
            Msg.listen('', { type: 'ShowSNPPopup' }, function (context, snpid) {
                ShowSNPPopup.handlePopup(snpid);
            });

            //Create event listener for actions to open a population popup window
            Msg.listen('', { type: 'ShowPopulation' }, function (context, popid) {
                var pop = MetaDataDynamic.populationsMap[popid];
                var content = 'Samples for this population were collected by the following [@' + DQX.pluralise('study', pop.studies.length) + ']:';
                $.each(pop.studies, function (idx, study) {
                    content += '<p>';
                    var ctrl = Controls.LinkButton('', { smartLink: true, text: study.Title });
                    ctrl.study = study;
                    ctrl.setOnChanged(function (id, theControl) {
                        Popup.closeUnPinnedPopups();
                        Msg.send({ type: 'ShowStudy' }, theControl.study.ID);
                    });
                    content += ctrl.renderHtml();
                });
                var popupID = Popup.create("Population: " + pop.Name, content);
            });

        }

        return ShowSNPPopup;
    });
