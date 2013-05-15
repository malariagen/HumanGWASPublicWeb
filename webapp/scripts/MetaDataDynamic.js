define([DQXSC("Utils"), DQXSC("SQL"), DQXSC("DataFetcher/DataFetchers"), "MetaData"],
    function (DQX, SQL, DataFetcher, MetaData) {
        var MetaDataDynamic = {};

        MetaDataDynamic.getStudyInfo = function (studyid) {
            if (!MetaDataDynamic.studiesMap[studyid])
                DQX.reportError('Invalid study ID '+studyid);
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

            MetaDataDynamic.studiesList = [];
            MetaDataDynamic.studiesMap = {};
            for (var i = 0; i < MetaDataDynamic._dataStudies.study.length; i++) {
                var study = { ID: MetaDataDynamic._dataStudies.study[i], Title: MetaDataDynamic._dataStudies.title[i], Description: MetaDataDynamic._dataStudies.description[i] };
                MetaDataDynamic.studiesList.push(study);
                MetaDataDynamic.studiesMap[study.ID] = study;
            }

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
                sortColumn: "study"
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

        return MetaDataDynamic;
    });
