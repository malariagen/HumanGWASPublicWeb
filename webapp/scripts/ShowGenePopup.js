define([DQXSCRQ(), DQXSC("Framework"), DQXSC("Msg"), DQXSC("SQL"), DQXSC("DocEl"), DQXSC("Popup"), DQXSC("Controls"), DQXSC("DataFetcher/DataFetchers"), "MetaData"],
    function (require, Framework, Msg, SQL, DocEl, Popup, Controls, DataFetchers, MetaData) {


        var ShowGenePopup = {}



        ShowGenePopup.createPopup = function (geneid, data) {

            var content = '';
            //content += DQX.CreateKeyValueTable(data);
            
            content += "<table>";
                content += "<tr>";
                content += "<td><b>Gene</b></td>";
                content += '<td style="padding-left:5px;max-width:300px;word-wrap:break-word;">' + data[MetaData.databases.Annotation.tables.Annotation.nameColumn] + "</td>";
                content += "</tr>";
                content += "<tr>";
                content += "<td><b>Chromosome</b></td>";
                content += '<td style="padding-left:5px;max-width:300px;word-wrap:break-word;">' + data[MetaData.databases.Annotation.tables.Annotation.chromosomeColumn] + "</td>";
                content += "</tr>";
                content += "<tr>";
                content += "<td><b>Start&nbsp;position</b></td>";
                content += '<td style="padding-left:5px;max-width:300px;word-wrap:break-word;">' + data[MetaData.databases.Annotation.tables.Annotation.startPositionColumn] + "</td>";
                content += "</tr>";
                content += "<tr>";
                content += "<td><b>End&nbsp;position</b></td>";
                content += '<td style="padding-left:5px;max-width:300px;word-wrap:break-word;">' + data[MetaData.databases.Annotation.tables.Annotation.stopPositionColumn] + "</td>";
                content += "</tr>";
            content += "</table>"
            
            var geneName = data[MetaData.databases.Annotation.tables.Annotation.nameColumn];

            
            
            var UniProtButtonArgs = { buttonClass: 'DQXToolButton2', content: 'UniProt', width: 60, height: 20 };
            var UniProtButton = Controls.Button(null, UniProtButtonArgs);
            UniProtButton.setOnChanged(function () {
                var url = 'http://www.uniprot.org/uniprot/?query={geneName}&sort=score'.DQXformat({ geneName: geneName });
                window.open(url, '_blank');
            });

            var EnsemblButtonArgs = { buttonClass: 'DQXToolButton2', content: 'Ensembl', width: 60, height: 20 };
            var EnsemblButton = Controls.Button(null, EnsemblButtonArgs);
            EnsemblButton.setOnChanged(function () {
                var url = 'http://www.ensembl.org/Homo_sapiens/Search/Details?db=core;end=1;idx=Gene;q={geneName};species=Homo_sapiens;'.DQXformat({ geneName: geneName });
                window.open(url, '_blank');
            });
            
            
            var UCSCButtonArgs = { buttonClass: 'DQXToolButton2', content: 'UCSC', width: 60, height: 20 };
            var UCSCButton = Controls.Button(null, UCSCButtonArgs);
            UCSCButton.setOnChanged(function () {
                var url = 'http://genome.ucsc.edu/cgi-bin/hgTracks?hgHubConnect.destUrl=..%2Fcgi-bin%2FhgTracks&clade=mammal&org=Human&db=hg19&position={geneName}&hgt.positionInput={geneName}&hgt.suggestTrack=knownGene'.DQXformat({ geneName: geneName });
                window.open(url, '_blank');
            });
            
            
            var HUGOButtonArgs = { buttonClass: 'DQXToolButton2', content: 'HUGO', width: 60, height: 20 };
            var HUGOButton = Controls.Button(null, HUGOButtonArgs);
            HUGOButton.setOnChanged(function () {
                var url = 'http://www.genenames.org/cgi-bin/quick_search.pl?.cgifields=type&type=contains&num=50&search={geneName}&submit=Submit'.DQXformat({ geneName: geneName });
                window.open(url, '_blank');
            });
            
            
            var buttonsList = [];
            buttonsList.push(UniProtButton);
            buttonsList.push(EnsemblButton);
            buttonsList.push(UCSCButton);
            buttonsList.push(HUGOButton);
            
            var verticalButtonsList = Controls.CompoundVert(buttonsList);
            content += verticalButtonsList.renderHtml();
            

            var popupID = Popup.create("Gene " + data[MetaData.databases.Annotation.tables.Annotation.nameColumn], content);

        }


        ShowGenePopup.handlePopup = function (geneid) {
            var myurl = DQX.Url(serverUrl);
            myurl.addUrlQueryItem("datatype", 'recordinfo');
            myurl.addUrlQueryItem("qry", SQL.WhereClause.encode(SQL.WhereClause.CompareFixed(MetaData.databases.Annotation.tables.Annotation.idColumn, '=', geneid)));
            myurl.addUrlQueryItem("database", MetaData.databases.Annotation.url);
            myurl.addUrlQueryItem("tbname", MetaData.databases.Annotation.tables.Annotation.tableName );
            $.ajax({
                url: myurl.toString(),
                success: function (resp) {
                    DQX.stopProcessing();
                    var keylist = DQX.parseResponse(resp);
                    if ("Error" in keylist) {
                        alert(keylist.Error);
                        return;
                    }
                    ShowGenePopup.createPopup(geneid, keylist.Data);
                },
                error: DQX.createMessageFailFunction()
            });
            DQX.setProcessing("Downloading...");

        }

        ShowGenePopup.init = function () {

            //Create event listener for actions to open a SNP popup window
            Msg.listen('', { type: 'ShowGenePopup' }, function (context, geneid) {
                ShowGenePopup.handlePopup(geneid);
            });
        }

        return ShowGenePopup;
    });