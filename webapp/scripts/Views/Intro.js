define([DQXSCRQ(), DQXSC("Framework"), DQXSC("HistoryManager"), DQXSC("Controls"), DQXSC("Msg"), DQXSC("DocEl"), DQXSC("Utils"), "ShowSNPPopup", "PlayGround"],
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

                };

                that.createFramework = function () {
                    HistoryManager.setCallBackChangeState(function (stateKeys) {
                        if ('start' in stateKeys)
                            disableHomeButton();
                        else
                            enableHomeButton();
                    });
                };

                that.createNavigationButton = function (id, parentDiv, bitmap, content, styleClass, width) {
                    var button = DocEl.Div({ id: id, parent: parentDiv });
                    button.setCssClass(styleClass);
                    button.addStyle('display', 'inline-block');
                    button.setHeightPx(30);
                    button.setWidthPx(width);
                    if (bitmap)
                        button.addElem('<IMG style="float:left;margin-right:5px;" SRC="{bmp}" border=0  ALT=""></IMG>'.DQXformat({ bmp: bitmap }));
                    button.addElem(content);
                };


                that.createNavigationSection = function () {
                    var navSectionDiv = DocEl.Div();
                    navSectionDiv.addStyle("position", "absolute");
                    navSectionDiv.addStyle("right", "0px");
                    navSectionDiv.addStyle("top", "0px");
                    this.createNavigationButton("HeaderHome", navSectionDiv, 'Bitmaps/home.png', "Go to<br>Intro page", "DQXToolButton2",110);
                    $('#' + this.myHeaderFrame.getClientDivID()).append(navSectionDiv.toString());
                    $('#HeaderHome').mousedown(function () { Msg.send({ type: 'Home' }) });
                   
                    disableHomeButton();
                };

                disableHomeButton = function () {
                    $('#HeaderHome').css('opacity', 0.3);
                }
                enableHomeButton = function () {
                    $('#HeaderHome').css('opacity', 1.0);
                }


                that.createButton = function (id, parentDiv, bitmap, content, style) {
                    var button = DocEl.Div({ id: id, parent: parentDiv });
                    button.setWidthPx(200);
                    button.addStyle('margin', '10px');
                    button.setWidthPx(200);
                    button.setHeightPx(50);
                    button.setCssClass(style);
                    button.addStyle('float', 'left');
                    if (bitmap)
                        button.addElem('<IMG style="float:left;margin-right:8px;margin-top:3px" SRC="{bmp}" border=0  ALT=""></IMG>'.DQXformat({ bmp: bitmap }));
                    button.addElem(content);
                };

                that.createWizardButtons = function () {
                    var buttondiv = DocEl.Div();
                    buttondiv.addStyle('clear', 'both');
                  
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
                            id: 'IntroVariantTable',
                            name: "Variant table",
                            bitmap: 'Bitmaps/Icons/Medium/VariantCatalogue.png',
                            location: buttondiv1,
                            handler: function () {
                                DQX.executeProcessing(function () {
                                    that.myPage.frameVariantTable.makeVisible();
                                });
                            }
                        },
                        {
                            id: 'IntroStudies',
                            name: "Studies",
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
                        this.createButton(jumpStart.id, jumpStart.location, jumpStart.bitmap, jumpStart.name, "DQXToolButton3");
                    }
                    $('#' + this.myFrame.getClientDivID()).append(buttondiv1.toString());
                    $('#' + this.myFrame.getClientDivID()).append(buttondiv2.toString());
                    for (var i = 0; i < jumpStarts.length; i++) {
                        var jumpStart = jumpStarts[i];
                        $('#' + jumpStart.id).mousedown(jumpStart.handler);
                    }
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