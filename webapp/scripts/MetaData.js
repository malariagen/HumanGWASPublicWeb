define([DQXSC("Utils"), "scripts/helper/log10.js"],
    function (DQX) {
        var MetaData = {};

        MetaData.database = 'humangwaspublic';

        MetaData.tableCountries = 'countries';
        MetaData.tableSnpData = 'snpdata'; //SNP information (including population frequencies)
        MetaData.tableSiteInfo = 'location'; //Information about sampling sites
        MetaData.tableStudy = 'study'; //Information about studies
        MetaData.tableSampleClassification = 'sample_classification';
        MetaData.tableSampleClassificationType = 'sample_classification_type';
        MetaData.tableSampleClassificationContextCount = 'sample_classification_context_count'; //Contains # of samples for each sampleclassification x samplecontext combination
        MetaData.tableSampleContextInfo = 'sample_context'; //Information about study contexts

        return MetaData;
    });
