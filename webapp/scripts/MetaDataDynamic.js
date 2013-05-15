define([DQXSC("Utils"), DQXSC("SQL"), DQXSC("DataFetcher/DataFetchers"), DQXSC("Controls"), DQXSC("Popup"), DQXSC("Msg"), "MetaData"],
    function (DQX, SQL, DataFetcher, Controls, Popup, Msg, MetaData) {
        var MetaDataDynamic = {};

        MetaDataDynamic.getStudyInfo = function (studyid) {
            if (!MetaDataDynamic.studiesMap[studyid])
                DQX.reportError('Invalid study ID ' + studyid);
            return MetaDataDynamic.studiesMap[studyid];
        }

        MetaDataDynamic.tryBuildMetaDataStructures = function (onCompletedHandler) {
            //wait until all data has been fetched
            var fetchCompleted = true;
            $.each(MetaDataDynamic.fetchedTables, function (ID) {
                if (!MetaDataDynamic[ID])
                    fetchCompleted = false;
            });
            if (!fetchCompleted)
                return;

            //Assemble studies
            MetaDataDynamic.studiesList = [];
            MetaDataDynamic.studiesMap = {};
            for (var i = 0; i < MetaDataDynamic._dataStudies.study.length; i++) {
                var study = { ID: MetaDataDynamic._dataStudies.study[i], Title: MetaDataDynamic._dataStudies.title[i], Description: MetaDataDynamic._dataStudies.description[i] };
                MetaDataDynamic.studiesList.push(study);
                MetaDataDynamic.studiesMap[study.ID] = study;
            }

            //Assemble sites
            //Create sites info
            MetaDataDynamic.sites = [];
            MetaDataDynamic.sitesMap = {};
            for (var i = 0; i < MetaDataDynamic._dataSites.location.length; i++) {
                var site = {
                    ID: MetaDataDynamic._dataSites.location[i],
                    Name: MetaDataDynamic._dataSites.name[i],
                    Country: MetaDataDynamic._dataSites.country[i],
                    longit: MetaDataDynamic._dataSites.longit[i],
                    lattit: MetaDataDynamic._dataSites.lattit[i],
                    Sample_Contexts: []
                };
                MetaDataDynamic.sites.push(site);
                MetaDataDynamic.sitesMap[site.ID] = site;
                //Attach site to study
                MetaDataDynamic.studiesMap[site.ID].sites = [site];
            }

            MetaDataDynamic.createSnpFieldList();


            onCompletedHandler();
        }

        MetaDataDynamic.handleFetchError = function (msg) {
            if (!MetaDataDynamic.fetchErrorReported) {
                MetaDataDynamic.fetchErrorReported = true;
                alert('ERROR: failed to fetch data from the server: ' + msg);
            }
        }


        MetaDataDynamic.fetch = function (onCompletedHandler) {

            MetaDataDynamic.fetchedTables = {};

            MetaDataDynamic.fetchedTables['_dataCountries'] = {
                tableName: MetaData.tableCountries,
                columns: [{ name: "ID" }, { name: "Name"}],
                sortColumn: "Name"
            };

            MetaDataDynamic.fetchedTables['_dataSites'] = {
                tableName: MetaData.tableSiteInfo,
                columns: [{ name: "location" }, { name: "name" }, { name: "lattit", encoding: "F3" }, { name: "longit", encoding: "F3" }, { name: "country"}],
                sortColumn: "country"
            };

            MetaDataDynamic.fetchedTables['_dataStudies'] = {
                tableName: MetaData.tableStudy,
                columns: [{ name: "study" }, { name: "title" }, { name: "description"}],
                sortColumn: "title"
            };

            MetaDataDynamic.fetchedTables['_dataSampleContexts'] = {
                tableName: MetaData.tableSampleContextInfo,
                columns: [{ name: "sample_context" }, { name: "title" }, { name: "description" }, { name: "study" }, { name: "location" }, { name: "samplecount", encoding: "IN"}],
                sortColumn: "title"
            };

            MetaDataDynamic.fetchedTables['_dataSampleClassifications'] = {
                tableName: MetaData.tableSampleClassification,
                columns: [{ name: "sample_classification" }, { name: "sample_classification_type" }, { name: "name" }, { name: "lattit", encoding: "F3" }, { name: "longit", encoding: "F3"}],
                sortColumn: "ordr"
            };

            MetaDataDynamic.fetchedTables['_dataSampleClassificationTypes'] = {
                tableName: MetaData.tableSampleClassificationType,
                columns: [{ name: "sample_classification_type" }, { name: "name" }, { name: "name" }, { name: "description"}],
                sortColumn: "ordr"
            };

            MetaDataDynamic.fetchedTables['dataSampleClassificationContextCount'] = {
                tableName: MetaData.tableSampleClassificationContextCount,
                columns: [{ name: "sample_classification" }, { name: "sample_context" }, { name: "count", encoding: "IN"}],
                sortColumn: "sample_classification"
            };

            //Perform all the data fetching
            $.each(MetaDataDynamic.fetchedTables, function (ID, tableInfo) {
                var fetcher = DataFetcher.RecordsetFetcher(serverUrl, MetaData.database, tableInfo.tableName);
                $.each(tableInfo.columns, function (colidx, columnInfo) {
                    var encoding = columnInfo.encoding;
                    if (!encoding) encoding = 'ST';
                    fetcher.addColumn(columnInfo.name, encoding);
                });
                fetcher.getData(SQL.WhereClause.Trivial(), tableInfo.sortColumn, function (data) {
                    MetaDataDynamic[ID] = data;
                    MetaDataDynamic.tryBuildMetaDataStructures(onCompletedHandler);
                },
                            function (msg) { MetaDataDynamic.handleFetchError(msg + ' data: ' + tableInfo.tableName); }
                        );
            });
        }




        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        //A class providing information about the behaviour of data types for fields in the SNP data set
        //The constructor takes the data type identifier as an argument
        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        //Comverts fraction information to color encoding
        var funcFraction2Color = function (vl) {
            if (vl == null)
                return "white";
            else {
                var vl = Math.abs(vl);
                vl = Math.min(1, vl);
                if (vl > 0) vl = 0.05 + vl * 0.95;
                vl = Math.sqrt(vl);
                /*                var g = 255 * (1 - 0.3 * vl * vl * vl * vl);
                var r = 255 * (1 - vl * vl);
                var b = 255 * (1 - vl);*/
                var b = 255; //* (1 - 0.3 * vl * vl * vl * vl);
                var g = 255 * (1 - 0.3 * vl * vl);
                var r = 255 * (1 - 0.6 * vl);
                return "rgb(" + parseInt(r) + "," + parseInt(g) + "," + parseInt(b) + ")";
            }
        };

        var funcFST2Color = function (vl) {
            if (vl == null)
                return "white";
            else {
                var vl = Math.abs(vl);
                vl = Math.min(1, vl);
                if (vl > 0) vl = 0.05 + vl * 0.95;
                vl = Math.sqrt(vl);
                var b = 255 * (1 - 0.3 * vl * vl * vl * vl);
                var g = 255 * (1 - 0.5 * vl * vl);
                var r = 255 * (1 - vl);
                return "rgb(" + parseInt(r) + "," + parseInt(g) + "," + parseInt(b) + ")";
            }
        };

        //Converts fraction information to text
        var funcFraction2Text = function (x) {
            if ((x == null) || (x == 'None'))
                return "-";
            else {
                if (x == 0) return '0';
                var st = (parseFloat(x)).toFixed(3);
                if (st == '0.000')
                    st = "0.000";
                return st;
            }
        };


        var funcBase2Color = function (vl) {
            /*            if (vl == 'A')
            return DQX.Color(1.0, 0.95, 0.95);
            if (vl == 'C')
            return DQX.Color(0.85, 0.95, 0.85);
            if (vl == 'G')
            return DQX.Color(0.95, 0.95, 1.0);
            if (vl == 'T')
            return DQX.Color(0.95, 0.95, 0.8);*/
            return "white";
        };

        var MGDataType = function (dataTypeID) {
            var that = {};
            that.dataTypeID = dataTypeID;

            that.getMinValue = function () {
                if (this.isFraction()) return 0;
                DQX.reportError("Data type '{tpe}' does not have a minimum value'".DQXformat({ tpe: this.dataTypeID }));
            }

            that.getMaxValue = function () {
                if (this.isFraction()) return 1; //!!!todo: set to 0.5 for MAF
                DQX.reportError("Data type '{tpe}' does not have a maximum value'".DQXformat({ tpe: this.dataTypeID }));
            }

            that.isFraction = function () {
                //if (this.dataTypeID == "FST") return true;
                if (this.dataTypeID == "AlleleFrequency") return true;
                return false;
            }

            that.isFloat = function () {
                if (this.isFraction()) return true;
                if (this.dataTypeID == "Float") return true;
                return false;
            }

            that.isString = function () {
                if (this.dataTypeID == "String") return true;
                if (this.dataTypeID == "SampleSetAera") return true;
                if (this.dataTypeID == "MutationType") return true;
                if (this.dataTypeID == "Base") return true;
                return false;
            }

            that.getDownloadType = function () {
                if (this.isFloat()) return "Float3";
                if (this.isString()) return "String";
                DQX.reportError("Unrecognised data type '{tpe}'".DQXformat({ tpe: dataType }));
            }

            that.getQueryBuilderType = function () {
                if (this.dataTypeID == "SampleSetAera") return "MultiChoiceInt";
                if (this.dataTypeID == "Base") return "MultiChoiceInt";
                if (this.dataTypeID == "MutationType") return "MultiChoiceInt";
                if (this.isFloat()) return "Float";
                if (this.isString()) return "String";
                DQX.reportError("Unrecognised data type '{tpe}'".DQXformat({ tpe: dataType }));
            }

            that.getMultipeChoiceList = function () {
                if (this.dataTypeID == "SampleSetAera") return theMetaData1.populationList;
                if (this.dataTypeID == "Base") return theMetaData1.baseList;
                if (this.dataTypeID == "MutationType") return [{ id: 'S', name: 'Synonymous' }, { id: 'N', name: 'Non-synonymous'}];
                return [];
            }

            that.getBackColorFunction = function () {
                if (this.dataTypeID == "Base") return funcBase2Color;
                /*if (this.dataTypeID == "FST")
                return funcFST2Color;*/
                if (this.isFraction())
                    return funcFraction2Color;
                if (this.dataTypeID == "MutationType") return function (vl) { if (vl == 'N') return DQX.Color(1, 0.8, 0.6); else return "white"; };
                return null;
            }

            that.getTextConvertFunction = function () {
                if (this.isFraction())
                    return funcFraction2Text;
                if (this.dataTypeID == "MutationType") return function (vl) { if (vl == 'N') return 'Non-syn'; else return 'Syn'; };
                return function (x) { if (x) return x.toString(); else return '-' };
            }

            return that;
        }


        MetaDataDynamic.createSnpFieldList = function () {

            MetaDataDynamic.snpFieldList = [];

            MetaDataDynamic.snpFieldList.push({ id: "ref", shortName: "Ref.<br>allele", name: "Reference allele", dataTypeID: "Base" });
            MetaDataDynamic.snpFieldList.push({ id: "nonrref", shortName: "Alt.<br>allele", name: "Non-reference allele", dataTypeID: "Base" });

            var frequencyTypeInfo = 'freq';
            $.each(MetaDataDynamic._dataCountries.ID, function (idx, countryID) {
                var countryName = MetaDataDynamic._dataCountries.Name[idx];
                var info = {
                    id: frequencyTypeInfo + "_" + countryID,
                    shortName: frequencyTypeInfo + "<br>" + countryID,
                    name: 'Allele frequency' + " in " + countryName,
                    comment: frequencyTypeInfo + " in " + countryName,
                    dataTypeID: "AlleleFrequency"
                }
                info.createCustomInfo = function () {
                    var content2 = '';
                    var studyCount = 0;
                    $.each(MetaDataDynamic.studiesList, function (idx, study) {
                        var isMember = false;
                        $.each(study.sites, function (idx2, site) { if (site.Country == countryID) isMember = true; });
                        if (isMember) {
                            studyCount++;
                            content2 += '<p>';
                            var ctrl = Controls.LinkButton('', { smartLink: true, text: study.Title });
                            ctrl.study = study;
                            ctrl.setOnChanged(function (id, theControl) {
                                Popup.closeUnPinnedPopups();
                                Msg.send({ type: 'ShowStudy' }, theControl.study.ID);
                            });
                            content2 += ctrl.renderHtml();
                        }
                        content = 'Samples for this population were collected by the following [@' + DQX.pluralise('study', studyCount) + ']:' + content2;
                    });
                    return content;
                }
                MetaDataDynamic.snpFieldList.push(info);
            });

            $.each(MetaDataDynamic.snpFieldList, function (idx, field) {
                field.dataType = MGDataType(field.dataTypeID);
            });

            var q = 0;
        }


        return MetaDataDynamic;
    });
