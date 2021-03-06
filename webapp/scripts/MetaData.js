define(["DQX/Utils", "scripts/helper/log10.js"],
    function (DQX) {
        var MetaData = {};

        MetaData.database = 'humangwaspublic';

        MetaData.tableCountries = 'countries';
        MetaData.tableSnpData = 'snpdata_float2'; //SNP information (including population frequencies)
        MetaData.tableSiteInfo = 'location'; //Information about sampling sites
        MetaData.tableStudy = 'study'; //Information about studies
        MetaData.tableSampleClassification = 'sample_classification';
        MetaData.tableSampleClassificationType = 'sample_classification_type';
        MetaData.tableSampleClassificationContextCount = 'sample_classification_context_count'; //Contains # of samples for each sampleclassification x samplecontext combination
        MetaData.tableSampleContextInfo = 'sample_context'; //Information about study contexts

        MetaData.tableAnnotation = 'refGeneConverted';
        MetaData.annotationTranslateChromoId = function (id) { return 'chr' + parseInt(id, 10); }
        MetaData.annotationInvTranslateChromoId = function (id) {
            var nr = id.slice(3);
            if (nr.length < 2) nr = '0' + nr;
            return nr;
        }

        MetaData.chromosomes = [
            { "id": "01", "name": "01", "len": 250 },
            { "id": "02", "name": "02", "len": 245 },
            { "id": "03", "name": "03", "len": 205 },
            { "id": "04", "name": "04", "len": 195 },
            { "id": "05", "name": "05", "len": 185 },
            { "id": "06", "name": "06", "len": 175 },
            { "id": "07", "name": "07", "len": 165 },
            { "id": "08", "name": "08", "len": 150 },
            { "id": "09", "name": "09", "len": 145 },
            { "id": "10", "name": "10", "len": 140 },
            { "id": "11", "name": "11", "len": 140 },
            { "id": "12", "name": "12", "len": 135 },
            { "id": "13", "name": "13", "len": 120 },
            { "id": "14", "name": "14", "len": 110 },
            { "id": "15", "name": "15", "len": 105 },
            { "id": "16", "name": "16", "len": 95 },
            { "id": "17", "name": "17", "len": 85 },
            { "id": "18", "name": "18", "len": 80 },
            { "id": "19", "name": "19", "len": 70 },
            { "id": "20", "name": "20", "len": 70 },
            { "id": "21", "name": "21", "len": 55 },
            { "id": "22", "name": "22", "len": 52 }
        ];

        MetaData.chromoIdMap = {};
        $.each(MetaData.chromosomes, function (idx, chromo) {
            MetaData.chromoIdMap[chromo.id] = chromo;
        });


        MetaData.isValidChromID = function (chromid) {
            return (chromid in MetaData.chromoIdMap);
        }


        return MetaData;
    });
