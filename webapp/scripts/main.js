
setupRequireJS();

require([DQXSCJQ(), DQXSC("Framework"), DQXSC("Msg"), DQXSC("HistoryManager"), DQXSC("Utils"), "Page"],
    function ($, Framework, Msg, HistoryManager, DQX, thePage) {
        $(function () {

            //Global initialisation of utilities
            DQX.Init();

            setTimeout(function () {

                //Fetch some data from the server that we need for running the app
                thePage.fetchRequiredInfo(function () {
                    //Create the frames
                    thePage.createFramework();

                    //Render frames
                    thePage.frameWindow.render('Div1');

                    //Some generic stuff after creation of the html
                    DQX.initPostCreate();


                    //trigger the initial synchronisation
                    HistoryManager.init();
                });
            }, 10);

        });
    });
