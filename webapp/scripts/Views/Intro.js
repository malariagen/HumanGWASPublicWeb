﻿define(["require", "DQX/Framework", "DQX/HistoryManager", "DQX/Controls", "DQX/Msg", "DQX/DocEl", "DQX/Utils", "ShowSNPPopup", "PlayGround"],
    function (require, Framework, HistoryManager, Controls, Msg, DocEl, DQX, ShowSNPPopup, PlayGround) {

        var IntroModule = {

            Instance: function (iPage, iFrame, iHeaderFrame) {
                var that = Framework.ViewSet(iFrame, 'start');
                that.myPage = iPage;
                that.myFrame = iFrame;
                that.myHeaderFrame = iHeaderFrame;
                that.registerView();

                that.createPanels = function () {
                    this.myHeaderFrame.setContentStaticDiv('HeaderIntroPanel');
                    this.myFrame.setContentStaticDiv('IntroPanel');

                    this.createNavigationSection();

                    $('#' + this.myFrame.getClientDivID()).append('<div style="clear:both"/><br>');
                    this.createJumpStartButtons();

                    $('#' + this.myFrame.getClientDivID()).append('<div style="clear:both"><br></div>');
                    this.createWizardButtons();

                    DQX.ExecPostCreateHtml();

                };

                that.createFramework = function () {
                    HistoryManager.setCallBackChangeState(function (stateKeys) {
                        if ('start' in stateKeys)
                            disableHomeButton();
                        else
                            enableHomeButton();
                    });
                };

                that.createNavigationButton = function (id, parentDiv, bitmap, content, styleClass, width, handlerFunction) {
                    var bt = Controls.Button(id, { bitmap: bitmap, content: content, buttonClass: styleClass, width: width, height: 30 });
                    bt.setOnChanged(handlerFunction);
                    parentDiv.addElem(bt.renderHtml());
                };


                that.createNavigationSection = function () {
                    var navSectionDiv = DocEl.Div();
                    navSectionDiv.addStyle("position", "absolute");
                    navSectionDiv.addStyle("right", "0px");
                    navSectionDiv.addStyle("top", "0px");
                    navSectionDiv.addStyle("padding-top", "3px");
                    navSectionDiv.addStyle("padding-right", "5px");
                    this.createNavigationButton("HeaderPrevious", navSectionDiv, 'Bitmaps/Icons/Small/Back.png', DQX.Text("NavButtonPrevious"), "DQXToolButton3", 100, function () { Msg.send({ type: 'Back' }) });
                    this.createNavigationButton("HeaderHome", navSectionDiv, 'Bitmaps/Icons/Small/Home.png', DQX.Text("NavButtonIntro"), "DQXToolButton3", 100, function () { Msg.send({ type: 'Home' }) });
                    this.createNavigationButton("HeaderFindSNP", navSectionDiv, 'Bitmaps/Icons/Small/MagGlassV.png'/*DQX.BMP('magnif2.png')*/, DQX.Text("NavButtonFindSNP"), "DQXToolButton1", 100, function () { Msg.send({ type: 'WizardFindSNP' }); });
                    this.createNavigationButton("HeaderFindGene", navSectionDiv, 'Bitmaps/Icons/Small/MagGlassG.png'/*DQX.BMP('magnif2.png')*/, DQX.Text("NavButtonFindGene"), "DQXToolButton1", 100, function () { Msg.send({ type: 'WizardFindGene' }); });
                    $('#' + this.myHeaderFrame.getClientDivID()).append(navSectionDiv.toString());
                    $('#HeaderHome').mousedown(function () { Msg.send({ type: 'Home' }) });

                    disableHomeButton();
                };

                disableHomeButton = function () {
                    //$('#HeaderHome').css('opacity', 0.3);
                }
                enableHomeButton = function () {
                    //$('#HeaderHome').css('opacity', 1.0);
                }


                that.createButton = function (id, parentDiv, bitmap, content, style, handlerFunction) {
                    var bt = Controls.Button(id, { bitmap: bitmap, content: content, buttonClass: style, width: 190, height: 51 });
                    bt.setOnChanged(handlerFunction);
                    parentDiv.addElem(bt.renderHtml());
                    /*                    var button = DocEl.Div({ id: id, parent: parentDiv });
                    button.setWidthPx(200);
                    button.addStyle('margin', '10px');
                    button.setWidthPx(200);
                    button.setHeightPx(50);
                    button.setCssClass(style);
                    button.addStyle('float', 'left');
                    if (bitmap)
                    button.addElem('<IMG style="float:left;margin-right:8px;margin-top:3px" SRC="{bmp}" border=0  ALT=""></IMG>'.DQXformat({ bmp: bitmap }));
                    button.addElem(content);*/
                };

                that.createWizardButtons = function () {
                    var buttondiv = DocEl.Div();
                    buttondiv.addStyle('clear', 'both');
                    this.createButton("IntroFindSNP", buttondiv, 'Bitmaps/Icons/Medium/MagGlassV.png', DQX.Text("StartButtonFindSNP"), "DQXToolButton1", function () { Msg.send({ type: 'WizardFindSNP' }); });
                    this.createButton("IntroFindGene", buttondiv, 'Bitmaps/Icons/Medium/MagGlassG.png', DQX.Text("StartButtonFindGene"), "DQXToolButton1", function () { Msg.send({ type: 'WizardFindGene' }); });

                    $('#' + this.myFrame.getClientDivID()).append('<p/>' + buttondiv.toString());

                };

                that.createJumpStartButtons = function () {
                    var buttondiv = DocEl.Div();
                    $('#' + this.myFrame.getClientDivID()).append(buttondiv.toString());

                    var buttondiv1 = DocEl.Div();
                    buttondiv1.addStyle('clear', 'both');

                    var buttondiv2 = DocEl.Div();
                    buttondiv2.addStyle('clear', 'both');

                    //List of the buttons we want to have
                    var jumpStarts = [
                        {
                            id: 'IntroButtonVariantTable',
                            name: "Browse <b>variants</b> and allele frequencies",
                            bitmap: 'Bitmaps/Icons/Medium/VariantCatalogue.png',
                            location: buttondiv1,
                            handler: function () {
                                DQX.executeProcessing(function () {
                                    that.myPage.frameVariantTable.makeVisible();
                                });
                            }
                        },
                        {
                            id: 'IntroButtonGenomeBrowser',
                            name: "Browse <b>GWAS</b> signal on genome",
                            bitmap: 'Bitmaps/Icons/Medium/GenomeAccessibility.png',
                            location: buttondiv1,
                            handler: function () {
                                DQX.executeProcessing(function () {
                                    that.myPage.frameGenomeBrowser.makeVisible();
                                });
                            }
                        },
                        {
                            id: 'IntroButtonStudies',
                            name: "Learn about the contributing <b>studies</b>",
                            bitmap: 'Bitmaps/Icons/Medium/PartnerStudies.png',
                            location: buttondiv1,
                            handler: function () {
                                DQX.executeProcessing(function () {
                                    that.myPage.frameStudies.makeVisible();
                                });
                            }
                        }
                    /*                        {
                    id: 'IntroTest',
                    name: "Test",
                    bitmap: '',
                    location: buttondiv1,
                    handler: function () {
                    PlayGround.testPopup();
                    }
                    }*/
                    ];

                    for (var i = 0; i < jumpStarts.length; i++) {
                        var jumpStart = jumpStarts[i];
                        this.createButton(jumpStart.id, jumpStart.location, jumpStart.bitmap, jumpStart.name, "DQXToolButton3", jumpStart.handler);
                    }
                    $('#' + this.myFrame.getClientDivID()).append(buttondiv1.toString());
                    $('#' + this.myFrame.getClientDivID()).append(buttondiv2.toString());
                };

                that.activateState = function () {
                    disableHomeButton();
                    var tabswitched = this.myFrame.makeVisible();
                    //that.panelBrowser.handleResize(); //force immediate calculation of size
                };


                return that;
            }

        };

        return IntroModule;
    });