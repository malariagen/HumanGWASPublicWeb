define([DQXSC("Utils"), "scripts/helper/log10.js"],
    function (DQX) {
        var MetaData = null ;
        $.ajax({
            type: 'GET',
            url: 'resources/metadata.json',
            dataType: 'json',
            success: function (data) {
                MetaData = data.MetaData; 
            },
            data: {},
            async: false
        });

        var signifStyle = 'FragmentBarRed';

        //Groups of properties that are available on a per-country basis.
        //Setting these here because they have functions which JSON doesn't support.
        MetaData.countryPropertyGroups = [
            { 
                title: 'Alleles',
                members: [
                    { id: 'AA', fracScale: function (data) { return data.AA / data.samplesTot }, format:"%.0f" },
                    { id: 'AB', fracScale: function (data) { return data.AB / data.samplesTot }, format: "%.0f" },
                    { id: 'BB', fracScale: function (data) { return data.BB / data.samplesTot }, format: "%.0f" },
                    { id: 'B_allele_frequency', fracScale: function (data) { return data.B_allele_frequency }, format: "%.3f" },
                    { id: 'maf', fracScale: function (data) { return data.maf }, format: "%.3f" }
                ]
            },
            { 
                title: 'Cases/Controls',
                members: [
                    { id: 'cases_AA', fracScale: function (data) { return data.cases_AA / data.samplesTot }, format: "%.0f" },
                    { id: 'controls_AA', fracScale: function (data) { return data.controls_AA / data.samplesTot }, format: "%.0f" },
                    { id: 'cases_AB', fracScale: function (data) { return data.cases_AB / data.samplesTot }, format: "%.0f" },
                    { id: 'controls_AB', fracScale: function (data) { return data.controls_AB / data.samplesTot }, format: "%.0f" },
                    { id: 'cases_BB', fracScale: function (data) { return data.cases_BB / data.samplesTot }, format: "%.0f" },
                    { id: 'controls_BB', fracScale: function (data) { return data.controls_BB / data.samplesTot }, format: "%.0f" },
                /*            { id: 'cases_NULL', fracScale: function (data) { return data.cases_NULL / data.samplesTot } },
                { id: 'controls_NULL', fracScale: function (data) { return data.controls_NULL / data.samplesTot } },
                { id: 'NULL' }*/
                ]
            },
            { 
                title: 'Frequentist',
                members: [
                    { id: 'info', format: "%.2f" },
                    { id: 'pvalue', fracScale: function (data) { return -log10(data.pvalue) / 10.0 }, fracStyle: signifStyle, format: "%.2e" },
                    { id: 'se_1', format: "%.3f" },
                    { id: 'beta_1', format: "%.3f" }
                ]
            }
        ];
        
        MetaData.formatVariableName = function( v ) {
            if( v.indexOf( '/bf' ) != -1 ) {
                // Remove boilerplate
                v = v.replace( 'ApproximateBayesianMetaAnalysis/', '' )
                    .replace( '/bf', '' )
                ;
                // Get rid of unnecessary rho specs..
                if( v.indexOf( '-specific' ) != -1 && v.indexOf( 'West-africa' ) == -1 && v.indexOf( 'East-africa' ) == -1 ) {
                    v = v.replace( 'rho=1/', '' ) ;
                }
                // rename some variables.
                if( v.substring( 0, 6 ) == 'rho=1/' ) {
                    v = v.replace( 'rho=1/', 'fixed-effect/' ) ;
                } else if( v.substring( 0, 6 ) == 'rho=0/' ) {
                    v = v.replace( 'rho=0/', 'independent-effect/' ) ;
                }
            } else if( v == "Fixed-effect meta analysis pvalue" ) {
                v = "Fixed-effect P-value" ;
            } else if( v == "mean_bf" ) {
                v = "Mean Bayes factor" ;
            }
            return v ;
        }

        return MetaData;
    });
