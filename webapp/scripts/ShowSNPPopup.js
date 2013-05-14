define(
    [DQXSCRQ(), DQXSC("Framework"), DQXSC("Msg"), DQXSC("SQL"), DQXSC("DocEl"), DQXSC("Popup"), DQXSC("PopupFrame"), DQXSC("Controls"), DQXSC("DataFetcher/DataFetchers"),
    "MetaData", "scripts/Externals/d3.min.js", "scripts/Externals/sprintf.min.js", "scripts/helper/log10.js", "scripts/helper/console.js"],
    function (require, Framework, Msg, SQL, DocEl, Popup, PopupFrame, Controls, DataFetchers, MetaData) {


        var ShowSNPPopup = {}

        var renderValueBar = function (val, frac, fracStyle, format) {
            var frac = Math.min(1, frac);
            var rs = '';
            if (frac > 0.01)
                rs += '<div class="{fracStyle}" style="height:100%;width:{prc}%;overflow:visible">'.DQXformat({ prc: 100 * frac, fracStyle: fracStyle });
            if (val === undefined || val == "None") {
                rs += 'NA';
            } else {
                rs += sprintf(format, val);
            }
            if (frac > 0.01)
                rs += '<div>';
            return rs;
        }

        ShowSNPPopup.createPropertyGroupTab = function (data, propgroup) {
            var tabItem = { title: propgroup.title };
            var content = '<table class="DQXStyledTable" style="background-color:white;border:1px solid black;margin-right:25px">';

            //write header
            content += "<tr>";
            content += "<th>";
            content += 'Population';
            content += "</th>";
            $.each(propgroup.members, function (idx1, prop) {
                content += "<th>";
                content += prop.id;
                content += "</th>";
            });
            content += "</tr>";

            //Create a row per country
            $.each(MetaData.countries, function (idx1, country) {
                //Extract the properties for this specific country
                var dataCountry = {};
                $.each(data, function (key, val) {
                    if (key.split(':')[0] == country) {
                        dataCountry[key.split(':')[1]] = parseFloat(val);
                    }
                });

                //Add calculated property: total number of samples
                dataCountry.samplesTot = (dataCountry.cases_AA) + (dataCountry.controls_AA) + (dataCountry.cases_AB) + (dataCountry.controls_AB) + (dataCountry.cases_BB) + (dataCountry.controls_BB) + (dataCountry.cases_NULL) + (dataCountry.controls_NULL) + (dataCountry.NULL);

                content += "<tr>";
                content += "<td>";
                content += '<b>' + country + '</b>';
                content += "</td>";
                $.each(propgroup.members, function (idx2, prop) {
                    content += "<td>";
                    var st = dataCountry[prop.id];
                    var frac = 0.0;
                    var fracStyle = 'FragmentBarBlue';
                    if ('fracScale' in prop)
                        frac = prop.fracScale(dataCountry);
                    if ('fracStyle' in prop)
                        fracStyle = prop.fracStyle;
                    st = renderValueBar((st), frac, fracStyle, prop.format);
                    content += st;
                    content += "</td>";
                });
                content += "</tr>";
            });
            content += "</table><p/>";
            tabItem.content = content;
            return tabItem;
        }

        ShowSNPPopup.createBayesFactorTab = function (snpid, data) {
            var tabItem = {
                title: "Meta-analysis models",
                content: '<div class="bayes_factor_plot" snpid="' + snpid + '"></div>',
                snpid: snpid
            };

            var keys = Object.keys(data);
            keys.sort(); //we want to show them sorted by name
            tabItem.data = []
            var sum_of_bfs = 0;

            $.each(keys, function (idx, key) {
                var elts = key.split('/');
                if (elts[elts.length - 1] == 'bf') {
                    var value = data[key];
                    if ((!(value === undefined)) && (value == value) && value != "None") {
                        value = parseFloat(value);
                        tabItem.data.push({ variable: MetaData.formatVariableName(key), value: value });
                        sum_of_bfs += parseFloat(value);
                    }
                }
            });

            tabItem.variables = MetaData.MetaAnalysisModelGroups;

            tabItem.render = function () {
                //var variables = this.data.map( function( d ) { return d.variable ; } ).sort() ;
                var models = [];
                $.each(this.variables, function (idx, l) {
                    if (idx > 0) {
                        // kludge to make some space.
                        models.push("spacer" + idx);
                    }
                    models = models.concat(l.models);
                });

                //console.log( "Plotting:", MetaData, variables, this.data ) ;

                var plotheight = 150;
                var plotwidth = 500;
                var margins = {
                    left: 70,
                    right: 70,
                    top: 10,
                    bottom: 200
                };
                var width = margins.left + margins.right + plotwidth;
                var height = margins.top + margins.bottom + plotheight;

                //Table for Bayesian data values
                var plot = d3.select('.bayes_factor_plot[snpid="' + snpid + '"]')
                    .append('svg')
                    .attr('class', 'bar_plot')
                    .attr('width', width)
                    .attr('height', height);

                var y_scale = d3.scale.linear()
                    .domain([0, d3.max(this.data, function (d) { return d.value; })])
                    .range([plotheight, margins.top]);

                var x_scale = d3.scale.ordinal()
                    .domain(models)
                    .rangeBands([margins.left, margins.left + plotwidth]);

                plot.selectAll('line.hAxisTick')
                    .data(models.filter(function (d) { return (d.indexOf('spacer') == -1); }))
                    .enter()
                    .append("line")
                    .attr('class', 'hAxisTick')
                    .attr('x1', function (d) { return x_scale(d) + 5; })
                    .attr('x2', function (d) { return x_scale(d) + 5; })
                    .attr('y1', plotheight)
                    .attr('y2', plotheight + 5)
                    .text(function (d) { return d; })
                ;

                plot.selectAll('text.hAxisLabel')
                    .data(models.filter(function (d) { return (d.indexOf('spacer') == -1); }))
                    .enter()
                    .append("text")
                    .attr('class', 'hAxisLabel')
                    .attr('dominant-baseline', 'central')
                    .attr('text-align', 'start')
                    .attr('transform', function (d) { return "translate(" + (x_scale(d) + 5) + "," + (plotheight + 6) + ") rotate( 60 )"; })
                    .text(function (d) {
                        console.log(d);
                        return d;
                    })
                ;

                plot.selectAll('line.vAxisTick')
                    .data(y_scale.ticks(10))
                    .enter()
                    .append("line")
                    .attr('class', 'vAxisTick')
                    .attr('x1', margins.left - 6)
                    .attr('x2', margins.left - 1)
                    .attr('y1', y_scale)
                    .attr('y2', y_scale)
                ;

                plot.selectAll('text.vAxisLabel')
                    .data(y_scale.ticks(10))
                    .enter()
                    .append("text")
                    .attr('class', 'vAxisLabel')
                    .attr('x', margins.left - 6)
                    .attr('dx', -3)
                    .attr('y', y_scale)
                    .attr('dominant-baseline', 'central')
                    .attr('text-anchor', 'end')
                    .text(
                        function (d) {
                            return d + "";
                        }
                    )
                ;

                plot.selectAll('rect')
                    .data(this.data)
                    .enter()
                    .append('rect')
                    .attr('width', 11)
                    .attr('height', function (d) { return plotheight - y_scale(d.value); })
                    .attr('y', function (d) { return y_scale(d.value); })
                    .attr('x', function (d) { return x_scale(d.variable); })
                ;
            }

            return tabItem;
        }

        ShowSNPPopup.createForestPlotTab = function (snpid, data) {
            var tabItem = {
                title: "Effect size",
                content: '<div class="effect_size_plot" snpid="' + snpid + '"></div>',
                snpid: snpid
            };

            var keys = Object.keys(data);
            keys.sort(); //we want to show them sorted by name
            tabItem.data = []
            console.log("data:", data);
            $.each(MetaData.countries, function (idx, country) {
                var beta = parseFloat(data[country + ":beta_1"]);
                var se = parseFloat(data[country + ":se_1"]);
                var frequency = parseFloat(data[country + ":B_allele_frequency"]);
                tabItem.data.push(
                    {
                        "country": country,
                        "beta": beta,
                        "se": se,
                        "OR": Math.exp(beta),
                        "CI_lower": Math.exp(beta - (1.96 * se)),
                        "CI_upper": Math.exp(beta + (1.96 * se)),
                        "frequency": frequency
                    }
                );
            });

            tabItem.render = function () {
                var countries = MetaData.countries;
                console.log("Plotting:", countries, this.data);

                var plotheight = 300;
                var plotwidth = 400;
                var margins = {
                    left: 100,
                    right: 120,
                    top: 10,
                    bottom: 50
                };
                var width = margins.left + margins.right + plotwidth;
                var height = margins.top + margins.bottom + plotheight;
                var plotbottom = margins.top + plotheight;
                var plotright = margins.left + plotwidth;

                var plot = d3.select('.effect_size_plot[snpid="' + snpid + '"]')
                    .append('svg')
                    .attr('class', 'forest_plot')
                    .attr('snpid', snpid)
                    .attr('width', width)
                    .attr('height', height);

                var y_scale = d3.scale.ordinal()
                    .domain(countries)
                    .rangeRoundBands([margins.top + 10, plotbottom - 10]);

                var x_scale = d3.scale.log()
                    .domain([1 / 8, 8])
                    .range([margins.left + 5, margins.left + plotwidth - 5]);

                plot.selectAll('text.yAxisLegend')
                    .data(['Population'])
                    .enter()
                    .append('text')
                    .attr('class', 'yAxisLegend')
                    .attr('dominant-baseline', 'central')
                    .attr('text-anchor', 'middle')
                    .attr('transform', function (d) { return "translate(10," + ((margins.top + plotbottom) / 2) + ") rotate( -90 )"; })
                    .text(function (d) { return d; })
                ;

                plot.selectAll('text.xAxisLegend')
                    .data(['OR (with 95% confidence interval)'])
                    .enter()
                    .append('text')
                    .attr('class', 'xAxisLegend')
                    .attr('dominant-baseline', 'text-before-edge')
                    .attr('text-anchor', 'middle')
                    .attr('x', (margins.left + plotright) / 2)
                    .attr('y', height - 20)
                    .text(function (d) { return d; })
                ;

                plot.selectAll('line.hAxisTick')
                    .data([1 / 8, 1 / 4, 1 / 2, 1, 2, 4, 8])
                    .enter()
                    .append("line")
                    .attr('class', 'hAxisTick')
                    .attr('x1', function (d) { return x_scale(d); })
                    .attr('x2', function (d) { return x_scale(d); })
                    .attr('y1', plotbottom)
                    .attr('y2', plotbottom + 5)
                ;

                plot.selectAll('line.vertGrid')
                    .data([1 / 8, 1 / 4, 1 / 2, 1, 2, 4, 8])
                    .enter()
                    .append("line")
                    .attr('class', 'vertGrid')
                    .attr('x1', function (d) { return x_scale(d); })
                    .attr('x2', function (d) { return x_scale(d); })
                    .attr('y1', margins.top + 2)
                    .attr('y2', plotbottom - 2)
                ;

                plot.selectAll('text.hAxisLabel')
                    .data([
                        { x: 1 / 8, label: '1/8' },
                        { x: 1 / 4, label: '1/4' },
                        { x: 1 / 2, label: '1/2' },
                        { x: 1, label: '1' },
                        { x: 2, label: '2' },
                        { x: 4, label: '4' },
                        { x: 8, label: '8' }
                    ])
                    .enter()
                    .append("text")
                    .attr('class', 'hAxisLabel')
                    .attr('dominant-baseline', 'text-before-edge')
                    .attr('text-anchor', 'middle')
                    .attr('x', function (d) { return x_scale(d.x); })
                    .attr('y', plotbottom + 6)
                    .text(function (d) { return d.label; })
                ;

                plot.selectAll('line.vAxisTick')
                    .data(countries)
                    .enter()
                    .append("line")
                    .attr('class', 'vAxisTick')
                    .attr('x1', margins.left - 6)
                    .attr('x2', margins.left - 1)
                    .attr('y1', y_scale)
                    .attr('y2', y_scale)
                ;

                plot.selectAll('text.vAxisLabel')
                    .data(countries)
                    .enter()
                    .append("text")
                    .attr('class', 'vAxisLabel')
                    .attr('x', margins.left - 6)
                    .attr('dx', -3)
                    .attr('y', y_scale)
                    .attr('dominant-baseline', 'central')
                    .attr('text-anchor', 'end')
                    .text(
                        function (d) {
                            return d;
                        }
                    )
                ;

                var error_bars = plot.selectAll('g.error_bar')
                    .data(this.data)
                    .enter()
                    .append('g')
                    .attr('class', 'frequency_marker')
                ;
                error_bars
                    .selectAll('line')
                    .data(function (d) {
                        console.log("d=", d); return [
                        { x1: d.CI_lower, x2: d.CI_lower, y1: y_scale(d.country) - 4, y2: y_scale(d.country) + 4 },
                        { x1: d.CI_lower, x2: d.CI_upper, y1: y_scale(d.country), y2: y_scale(d.country) },
                        { x1: d.CI_upper, x2: d.CI_upper, y1: y_scale(d.country) - 4, y2: y_scale(d.country) + 4 }
                        ]
                    })
                    .enter()
                    .append('line')
                    .attr('x1', function (d) { return x_scale(d.x1); })
                    .attr('x2', function (d) { return x_scale(d.x2); })
                    .attr('y1', function (d) { return d.y1; })
                    .attr('y2', function (d) { return d.y2; })
                ;

                var frequencies = this.data.map(function (d) { return d.frequency; }).sort();
                var radius_scale = d3.scale.linear()
                    .domain([frequencies[0], frequencies[frequencies.length - 1]])
                    .range([2, 12]);

                plot.selectAll('circle.frequency_marker')
                    .data(this.data)
                    .enter()
                    .append('circle')
                    .attr('class', 'frequency_marker')
                    .attr('cx', function (d) { return x_scale(d.OR); })
                    .attr('cy', function (d) { return y_scale(d.country); })
                    .attr('r', function (d) { return radius_scale(d.frequency); })
                ;
                var OR_markers = plot.selectAll('g.OR_marker')
                    .data(this.data)
                    .enter()
                    .append('g')
                    .attr('class', 'OR_marker')
                ;

                OR_markers
                    .selectAll("line")
                    .data(function (d) {
                        return [
                            { x1: x_scale(d.OR), x2: x_scale(d.OR), y1: y_scale(d.country) - 2, y2: y_scale(d.country) + 2 },
                            { x1: x_scale(d.OR) - 2, x2: x_scale(d.OR) + 2, y1: y_scale(d.country), y2: y_scale(d.country) }
                        ]
                    })
                    .enter()
                    .append('line')
                    .attr('x1', function (d) { return d.x1; })
                    .attr('x2', function (d) { return d.x2; })
                    .attr('y1', function (d) { return d.y1; })
                    .attr('y2', function (d) { return d.y2; })
                ;


                var legendData = radius_scale.ticks(5).map(
                    function (frequency, index) {
                        return {
                            frequency: frequency,
                            index: index,
                            y: ((margins.top + plotbottom) / 2) - 60 + (index * 30)
                        }
                    }
                );

                var legend = plot.selectAll('g.frequencyLegend')
                    .data(legendData)
                    .enter()
                    .append('g')
                    .attr('class', 'frequencyLegend');

                legend.selectAll('circle.frequency_marker')
                    .data(function (d) { return [d] })
                    .enter()
                    .append('circle')
                    .attr('class', 'frequency_marker')
                    .attr('cx', plotright + 30)
                    .attr('cy', function (d) { return d.y; })
                    .attr('r', function (d) { return radius_scale(d.frequency); })
                ;

                legend.selectAll('text')
                    .data(function (d) { return [d] })
                    .enter()
                    .append('text')
                    .attr('text-anchor', 'start')
                    .attr('dominant-baseline', 'central')
                    .attr('x', plotright + 60)
                    .attr('y', function (d) { return d.y; })
                    .text(function (d) { return d.frequency + ""; })
                ;

                legend.selectAll('text.legendTitle')
                    .data(["Frequency"])
                    .enter()
                    .append('text')
                    .attr('class', 'legendTitle')
                    .attr('text-anchor', 'middle')
                    .attr('x', plotright + 55)
                    .attr('y', ((margins.top + plotbottom) / 2) - 80)
                    .text('Frequency')
                ;
            }

            return tabItem;
        }

        ShowSNPPopup.createPopup = function (data) {
            var snpid = data[MetaData.databases.Analysis.tables.SNPDetails.snpIdColumn];
            var tabs = []; //Will contain a list of all tabs, defined as objects with 'title' and 'content'

            var this_obj = this;
            {
                var tabItem = {
                    title: "Overview",
                    content: "<div>We need to populate this!</div>"
                };
                tabs.push(tabItem);
            }

            tabs.push(this_obj.createForestPlotTab(snpid, data));
            tabs.push(this_obj.createBayesFactorTab(snpid, data));

            //Create a table per group of per-country properties
            $.each(MetaData.countryPropertyGroups, function (idx0, propgroup) {
                tabs.push(this_obj.createPropertyGroupTab(data, propgroup));
            });

            //Remove all country-related data values
            $.each(MetaData.countries, function (idx1, country) {
                $.each(data, function (key, val) {
                    if (key.split(':')[0] == country)
                        delete data[key];
                });
            });

            //Dump remaining data values
            tabs.push({ title: 'Other', content: DQX.CreateKeyValueTable(data) });

            //--> SNP popup content goes here (add items to 'tabs')

            //Creation of the PopupFrame
            var popup = PopupFrame.PopupFrame('SnpPopupFrame', Framework.FrameGroupTab(''), { title: snpid, sizeX: 700, sizeY: 400 });
            var frameRoot = popup.getFrameRoot();
            frameRoot.setFrameClass('DQXForm');
            frameRoot.setMarginsIndividual(0, 7, 0, 0);

            $.each(tabs, function (idx, tabItem) {
                tabItem.frame = frameRoot.addMemberFrame(Framework.FrameFinal('', 0.5)).setMargins(5).setDisplayTitle(tabItem.title).setFrameClassClient('DQXForm');
            });

            popup.render();


            $.each(tabs, function (idx, tabItem) {
                tabItem.frame.setContentHtml(tabItem.content);
                if (tabItem.hasOwnProperty('render')) {
                    tabItem.render();
                }
            });
        }

        ShowSNPPopup.handlePopup = function (snpid) {
            var dataFetcher = ShowSNPPopup.dataFetcherSNPDetails;
            dataFetcher.fetchFullRecordInfo(
                SQL.WhereClause.CompareFixed(MetaData.databases.Analysis.tables.SNPDetails.snpIdColumn, '=', snpid),
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
            ShowSNPPopup.dataFetcherSNPDetails = new DataFetchers.Curve(serverUrl, MetaData.databases.Analysis.url, MetaData.databases.Analysis.tables.SNPDetails.tableName, MetaData.databases.Analysis.tables.SNPDetails.positionColumn);

            //Create event listener for actions to open a SNP popup window
            Msg.listen('', { type: 'ShowSNPPopup' }, function (context, snpid) {
                ShowSNPPopup.handlePopup(snpid);
            });
        }

        return ShowSNPPopup;
    });
