define([DQXSC("Framework"), DQXSC("HistoryManager"), DQXSC("DocEl"), DQXSC("Msg"), DQXSC("StaticDocView"), "Views/Intro", "Views/VariantTable", "Views/Studies", "Views/MapSNPFrequencies", "Views/GenomeBrowser", "Wizards/WizardFindGene", "Wizards/WizardFindSNP", "MetaDataDynamic", "ShowSNPPopup", "ShowGenePopup"],
    function (Framework, HistoryManager, DocEl, Msg, StaticDocView, IntroModule, VariantTableModule, StudiesModule, MapSNPFrequenciesModule, GenomeBrowserModule, WizardFindGene, WizardFindSNP, MetaDataDynamic, ShowSNPPopup, ShowGenePopup) {
        thePage = {

            createFramework: function () {

                var appTitle = '<b>' + DQX.Text("AppTitle") + '</b>';

                WizardFindGene.init();
                WizardFindSNP.init();
                ShowSNPPopup.init();
                ShowGenePopup.init();

                thePage.frameWindow = Framework.FrameFullWindow(Framework.FrameGroupVert(''));
                thePage.frameRoot = thePage.frameWindow.getFrameRoot();
                thePage.frameRoot.setMargins(0).setSeparatorSize(0);

                //The top line of the page
                thePage.frameHeaderIntro = thePage.frameRoot.addMemberFrame(Framework.FrameFinal('HeaderIntro', 1))
                    .setFixedSize(Framework.dimY, 60).setFrameClassClient('DQXPage').setMargins(0).setAllowScrollBars(false, false); ;


                //The body panel of the page
                thePage.frameBody = thePage.frameRoot.addMemberFrame(Framework.FrameGroupStack('info', 1)).setFrameClassClient('DQXDarkFrame').setMargins(0);

                thePage.frameIntro = thePage.frameBody.addMemberFrame(Framework.FrameFinal('intro', 1))
                .setFrameClass('DQXClient').setDisplayTitle('Introduction').setDisplayTitle2(appTitle);


                var compositeViews = [];

                thePage.frameVariantTable = thePage.frameBody.addMemberFrame(Framework.FrameGroupHor('varianttable', 1))
                .setMarginsIndividual(0,0,0,0).setDisplayTitle('Variant table');
                compositeViews.push(thePage.frameVariantTable);

                thePage.frameStudies = thePage.frameBody.addMemberFrame(Framework.FrameGroupHor('studies', 1))
                .setMarginsIndividual(0, 0, 0, 0).setDisplayTitle('Studies');
                compositeViews.push(thePage.frameStudies);

                thePage.frameMapSNPFrequencies = thePage.frameBody.addMemberFrame(Framework.FrameGeneric('freqmap', 1))
                .setMarginsIndividual(0,0,0,0).setDisplayTitle('Mapped allele frequencies');
                compositeViews.push(thePage.frameMapSNPFrequencies);

                thePage.frameGenomeBrowser = thePage.frameBody.addMemberFrame(Framework.FrameGroupHor('genomebrowser', 1))
                .setMarginsIndividual(0, 0, 0, 0).setDisplayTitle('Genome browser');
                compositeViews.push(thePage.frameGenomeBrowser);

                $.each(compositeViews, function (idx, view) {
                    view.setMarginsIndividual(0, 0, 0, 0).setDisplayTitle2(appTitle);
                });


                thePage.frameStaticDoc = thePage.frameBody.addMemberFrame(Framework.FrameFinal('staticdoc', 1))
                    .setMargins(5).setFrameClass('DQXLight').setDisplayTitle('Documents').setDisplayTitle2(appTitle).setAllowSmoothScrollY();


                //Create the views

                thePage.IntroView = IntroModule.Instance(thePage, thePage.frameIntro, thePage.frameHeaderIntro);
                thePage.IntroView.createFramework();

                thePage.VariantTableView = VariantTableModule.Instance(thePage, thePage.frameVariantTable);
                thePage.VariantTableView.createFramework();

                thePage.StudiesView = StudiesModule.Instance(thePage, thePage.frameStudies);
                thePage.StudiesView.createFramework();

                thePage.MapSNPFrequenciesView = MapSNPFrequenciesModule.Instance(thePage, thePage.frameMapSNPFrequencies);
                thePage.MapSNPFrequenciesView.createFramework();

                thePage.GenomeBrowserView = GenomeBrowserModule.Instance(thePage, thePage.frameGenomeBrowser);
                thePage.GenomeBrowserView.createFramework();

                thePage.StaticDocView = StaticDocViewModule.Instance(thePage, thePage.frameStaticDoc);
                thePage.StaticDocView.createFramework();


                //Register some message handlers that can be used to navigate around in the app
                Msg.listen('', { type: 'Home' }, function (context) { if (!thePage.frameIntro.isVisible()) HistoryManager.setState({ start: null }); });
                Msg.listen('', { type: 'Back' }, function (context) { HistoryManager.back(); });
                //Msg.listen('', { type: 'ShowBrowser' }, function (context, studyid) { thePage.frameBrowser.makeVisible(); });

            },

            fetchRequiredInfo: function (onCompletedHandler) {
                thePage.metaDataDynamic = MetaDataDynamic.fetch(onCompletedHandler);
            }

        };

        return thePage;
    });
