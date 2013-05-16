define([DQXSCRQ(), DQXSC("lib/StyledMarker"), DQXSC("HistoryManager"), DQXSC("Framework"), DQXSC("Controls"), DQXSC("Msg"), DQXSC("DocEl"), DQXSC("Popup"), DQXSC("Utils"), DQXSC("Map"), DQXSC("FrameList"), "MetaDataDynamic"],
    function (require, StyledMarker, HistoryManager, Framework, Controls, Msg, DocEl, Popup, DQX, Map, FrameList, MetaDataDynamic) {
        var StudiesModule = {

            Instance: function (iPage, iFrame) {
                var that = Framework.ViewSet(iFrame, 'study');
                that.myPage = iPage;
                that._panelsCreated = false;
                that.registerView();

                that.createPanels = function () {
                    if (this._panelsCreated)
                        return;
                    this._panelsCreated = true;
                    this.createListStudies();
                    //Panel with description of a single study
                    this.formStudyDescription = Framework.Form(this.frameStudyDescription);
                    //Map with sites for study
                    this.panelStudyMap = Map.GMap(this.frameStudyMap, Map.Coord(15, 0), 3);

                    this.pointsetSite_inactive = Map.PointSet('CommunitySiteMapPointsInactive', this.panelStudyMap, 0, "Bitmaps/site2.png", { showLabels: false, showMarkers: true });
                    var pts = [];
                    for (var i = 0; i < MetaDataDynamic.sites.length; i++)
                        pts.push({
                            id: MetaDataDynamic.sites[i].ID,
                            longit: MetaDataDynamic.sites[i].longit,
                            lattit: MetaDataDynamic.sites[i].lattit,
                            labelName: MetaDataDynamic.sites[i].Name
                        });
                    this.pointsetSite_inactive.setPoints(pts);
                    Msg.listen('', { type: 'ClickMapPoint', id: this.pointsetSite_inactive.myID }, function (scope, id) {
                        Msg.send({ type: 'ShowStudy' }, id)
                    });


                    this.pointsetStudy_active = Map.PointSet('StudyMapPointsActive', this.panelStudyMap, 0, "Bitmaps/circle_purple_small.png", { showLabels: true, showMarkers: true });

                    //Msg.listen('', { type: 'ClickMapPoint', id: this.pointsetStudy_active.myID }, $.proxy(this.showSiteInfoPopup, this));

                };

                that.createFramework = function () {

                    //this.getFrame().setSeparatorSize(bigSeparatorSize);

                    this.frameStudiesList = that.getFrame().addMemberFrame(Framework.FrameFinal('Studylist', 0.35))
                        .setMargins(0).setDisplayTitle('Studies'/*DQX.Text('AllStudies')*/).setMinSize(Framework.dimX, 250).setMargins(0).setAllowScrollBars(false, false);

                    this.frameStudiesList.InsertIntroBox('Icons/Medium/PartnerStudies.png', 'Intro'/*DQX.Text('IntroStudiesView')*/, 'Doc/Studies/Help.htm');

                    this.frameStudy = that.getFrame().addMemberFrame(Framework.FrameGroupHor('Study', 0.7))
                        .setSeparatorSize(Framework.sepSizeSmall);

                    this.frameStudyCentral = this.frameStudy.addMemberFrame(Framework.FrameGroupVert('StudyCentral', 1)).setSeparatorSize(Framework.sepSizeSmall + 2);

                    this.frameStudyDescription = this.frameStudyCentral.addMemberFrame(Framework.FrameFinal('StudyDetails', 0.4))
                        .setFrameClass('DQXClient').setAllowSmoothScrollY().setMargins(0);

                    this.frameStudyMap = this.frameStudyCentral.addMemberFrame(Framework.FrameFinal('StudyMap', 0.6))
                        .setMargins(0).setAllowScrollBars(false, false);
                };


                that.createListStudies = function () {
                    this.listStudies = FrameList(this.frameStudiesList).setHasFilter();

                    var studieslist = MetaDataDynamic.studiesList;
                    var it = [];
                    for (var i = 0; i < studieslist.length; i++) {
                        var study = studieslist[i];
                        it.push({
                            id: study.ID,
                            content: ((study.Title.length > 0) ? study.Title : '<i>No title available</i>'),
                            icon: 'Bitmaps/Icons/VerySmall/PartnerStudies.png'
                        });
                    }
                    this.listStudies.setItems(it, null);
                    this.listStudies.render();
                    Msg.listen('', { type: 'SelectItem', id: this.listStudies.getID() }, function (scope, newid) { Msg.send({ type: 'ShowStudy' }, newid) });
                };


                that.renderActiveStudy = function () {
                    var activeStudyID = this.listStudies.getActiveItem();
                    if (!activeStudyID) {
                        this.formStudyDescription.clear();
                        this.formStudyDescription.addHtml('<br><div class="DQXLarge"><b><i><center>Please select a [@partnerstudy] from the list on the left.</center></i></b></div>');
                        this.formStudyDescription.render();
                        return;
                    }
                    var study = MetaDataDynamic.getStudyInfo(activeStudyID);
                    this.frameStudy.modifyDisplayTitle('[@Partnerstudy]: ' + study.Title);
                    this.formStudyDescription.clear();

                    var content = '<div class="DQXStaticContent" style="padding:10px">';

                    content += '<h3>' + study.Title + '</h3>';

                    var descr = study.Description;
                    if (!descr)
                        descr = '<i>There is no description available for this [@study]</i>'
                    content += '<p>' + descr + '<p>';

/*
                    content += '<b>This [@study] has contributed samples from the following sites:</b><br/>';
                    for (var i = 0; i < study.Sample_Contexts.length; i++) {
                        var sc = study.Sample_Contexts[i];
                        content += '<div style="display:inline-block;margin:7px;margin-right:15px;min-width:170px">';
                        content += sc.Site.getControl(function (id) { that.showSiteInfoPopup({}, id); }).renderHtml();
                        content += '</div>';
                    }*/

                    this.formStudyDescription.addHtml(content);

                    var sites_active = [];
                    for (var i = 0; i < study.sites.length; i++) {
                        var site = study.sites[i];
                        sites_active.push({
                            id: site.ID,
                            longit: site.longit,
                            lattit: site.lattit,
                            labelName: site.Name
                        });
                    }
                    this.pointsetStudy_active.clearPoints();
                    this.pointsetStudy_active.setPoints(sites_active);
                    if (!this.pointsetStudy_active.isInView())
                        this.pointsetStudy_active.zoomFit(1500);

                    this.formStudyDescription.render();

                };



                that.showSiteInfoPopup = function (scope, siteID) {

                    Msg.send({ type: 'ShowSitePopup' }, siteID);
                    return;
                }



                that.activateStudy = function (studyid) {
                    if (studyid) {
                        this.currentStudy = MetaDataDynamic.getStudyInfo(studyid);
                    }
                    this.createPanels();
                    this.listStudies.setActiveItem(studyid, true);
                    var tabswitched = !this.getFrame().isVisible();
                    this.getFrame().makeVisible();
                    this.renderActiveStudy();
                    if (tabswitched && studyid)
                        this.listStudies.scrollActiveInView();
                };

                that.activateState = function (stateKeys) {
                    this.activateStudy(stateKeys.study);
                };

                that.getStateKeys = function () {
                    return { study: this.listStudies.getActiveItem() };
                };


                return that;
            }

        };


        Msg.listen('', { type: 'ShowStudy' }, function (context, studyid) { HistoryManager.setState({ study: studyid }); });


        return StudiesModule;
    });
