define(
    ["require", "DQX/Framework", "DQX/Msg", "DQX/SQL", "DQX/DocEl", "DQX/Popup", "DQX/PopupFrame", "DQX/Controls", "DQX/DataFetcher/DataFetchers",
    "MetaData", "scripts/Externals/d3.min.js", "scripts/Externals/sprintf.min.js", "scripts/helper/log10.js", "scripts/helper/console.js"],
    function (require, Framework, Msg, SQL, DocEl, Popup, PopupFrame, Controls, DataFetchers, MetaData) {


        var PlayGround = {}

        PlayGround.testPopup = function () {//a test function

            //Initialise PopupFrame
            var popup = PopupFrame.PopupFrame('testPopupFrame', Framework.FrameGroupHor(''), { title: 'Test', sizeX: 900, sizeY: 400 });
            var frameRoot = popup.getFrameRoot();
            frameRoot.setFrameClass('DQXLight');
            frameRoot.setMarginsIndividual(0, 7, 0, 0);

            var settFrame = frameRoot.addMemberFrame(Framework.FrameFinal('', 0.5)).setMargins(5).setDisplayTitle('Settings').setFixedSize(Framework.dimX, 220);

            var tabpanel = frameRoot.addMemberFrame(Framework.FrameGroupTab('', 0.5)).setMarginsIndividual(0, 7, 0, 0).setDisplayTitle('Part 2').setFrameClass('DQXLight').setFrameClassClient('DQXForm');
            var tab01 = tabpanel.addMemberFrame(Framework.FrameFinal('', 0.5)).setMargins(5).setDisplayTitle('Tab 1');
            var tab02 = tabpanel.addMemberFrame(Framework.FrameFinal('', 0.5)).setMargins(5).setDisplayTitle('Tab 2');

            var stackpanel = frameRoot.addMemberFrame(Framework.FrameGroupStack('', 0.5)).setMargins(0).setDisplayTitle('Part 3').setFrameClass('DQXLight').setFrameClassClient('DQXForm');
            var stc01 = stackpanel.addMemberFrame(Framework.FrameFinal('stc01', 0.5)).setMargins(5);
            var stc02 = stackpanel.addMemberFrame(Framework.FrameFinal('stc02', 0.5)).setMargins(5);

            popup.render();


            //Populate frame panels

            var settForm = Framework.Form(settFrame);
            //The following checkbox controls the visibility of two form components (cmp1,cmp2) and two panels (stc01,stc02)
            var chk = Controls.Check('', { label: 'Switch', value: true });
            settForm.addControl(chk);
            chk.setOnChanged(function () {
                showhide1.setVisible(chk.getValue());
                showhide2.setVisible(!chk.getValue());
                stackpanel.switchTab(chk.getValue() ? 'stc01' : 'stc02');
            });

            var cmp1 = Controls.CompoundVert([Controls.Check('', { label: 'Check1' }), Controls.Check('', { label: 'Check2' })]);
            cmp1.setLegend('Group 1');
            var showhide1 = Controls.ShowHide(cmp1);
            settForm.addControl(showhide1);

            var cmp2 = Controls.CompoundVert([Controls.Static('Test controls'), Controls.Check('', { label: 'Check 21' }), Controls.Check('', { label: 'Check 22' })]);
            cmp2.setLegend('Group 2');
            var showhide2 = Controls.ShowHide(cmp2).setVisible(false);
            settForm.addControl(showhide2);

            settForm.addControl(Controls.Static('<br/>fkjfj dkf kjfdkjf jkgfkj g'));

            settForm.render();

            tab01.setContentHtml('The content of tab component 1');
            tab02.setContentHtml('The content of tab component 2<br/>22222222222222222222');
            stc01.setContentHtml('The content of stack component 1');
            stc02.setContentHtml('The content of stack component 2<br/>22222222222222222222');

        }


        return PlayGround;
    });
