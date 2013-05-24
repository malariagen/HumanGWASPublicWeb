define([DQXSCRQ(), DQXSC("Framework"), DQXSC("Controls"), DQXSC("Msg"), DQXSC("Utils"), DQXSC("ChannelPlot/ChannelCanvas"), DQXSC("ChannelPlot/GenomePlotter"), DQXSC("DataFetcher/DataFetchers")],
    function (require, Framework, Controls, Msg, DQX, ChannelCanvas, GenomePlotter, DataFetchers) {

        var GenomeBrowserSNPChannel = {

            SNPChannel: function (iFetcher) {
                var that = ChannelCanvas.Base("PositionsSNPs");
                that.myFetcher = iFetcher;
                that.setTitle('[@Snps]');
                that._height = 20;
                that._pointsX = [];
                that._pointsIndex = [];
                that._minDrawZoomFactX = 0.00005;

                that.draw = function (drawInfo, args) {
                    var PosMin = Math.round((-50 + drawInfo.offsetX) / drawInfo.zoomFactX);
                    var PosMax = Math.round((drawInfo.sizeCenterX + 50 + drawInfo.offsetX) / drawInfo.zoomFactX);

                    this.drawStandardGradientCenter(drawInfo, 1);
                    this.drawStandardGradientLeft(drawInfo, 1);
                    this.drawStandardGradientRight(drawInfo, 1);

                    if (drawInfo.zoomFactX < this._minDrawZoomFactX) {
                        this.drawMessage(drawInfo, "Zoom in to see " + this._title);
                        return;
                    }


                    //Draw SNPs
                    this.myFetcher.IsDataReady(PosMin, PosMax, false);
                    var points = this.myFetcher.getColumnPoints(PosMin, PosMax, "snpid");
                    var xvals = points.xVals;
                    drawInfo.centerContext.fillStyle = DQX.Color(1.0, 0.75, 0.0,0.6).toStringCanvas();
                    drawInfo.centerContext.strokeStyle = DQX.Color(0.0, 0.0, 0.0,0.6).toStringCanvas();
                    this._pointsX = [];
                    var pointsX = this._pointsX;
                    this._pointsIndex = [];
                    var pointsIndex = this._pointsIndex;
                    this.startIndex = points.startIndex;

                    var psxLast = null;
                    for (var i = 0; i < xvals.length; i++) {
                        var x = xvals[i];
                        var psx = Math.round(x * drawInfo.zoomFactX - drawInfo.offsetX) + 0.5;
                        if (Math.abs(psx-psxLast)>0.9) {
                            pointsX.push(psx); pointsIndex.push(i + points.startIndex);
                            var psy = 4.5;
                            drawInfo.centerContext.beginPath();
                            drawInfo.centerContext.moveTo(psx, psy);
                            drawInfo.centerContext.lineTo(psx + 4, psy + 8);
                            drawInfo.centerContext.lineTo(psx - 4, psy + 8);
                            drawInfo.centerContext.lineTo(psx, psy);
                            drawInfo.centerContext.fill();
                            drawInfo.centerContext.stroke();
                            psxLast = psx;
                        }
                    }

                    this.drawMark(drawInfo);
                    this.drawXScale(drawInfo);
                    this.drawTitle(drawInfo);
                }


                that.getToolTipInfo = function (px, py) {
                    if ((py >= 0) && (py <= 20)) {
                        var pointsX = this._pointsX;
                        var pointsIndex = this._pointsIndex;
                        var mindst = 12;
                        var bestpt = -1;
                        for (var i = 0; i < pointsX.length; i++)
                            if (Math.abs(px - pointsX[i]) <= mindst) {
                                mindst = Math.abs(px - pointsX[i]);
                                bestpt = i;
                            }
                        if (bestpt >= 0) {
                            var info = { ID: 'SNP' + bestpt };
                            info.tpe = 'SNP';
                            info.px = pointsX[bestpt];
                            info.py = 13;
                            info.snpid = this.myFetcher.getColumnPoint(this.startIndex + bestpt, "snpid");
                            info.content = info.snpid;
                            info.showPointer = true;
                            return info;
                        }
                    }
                    return null;
                }

                that.handleMouseClicked = function (px, py) {
                    var tooltipInfo = that.getToolTipInfo(px, py);
                    if (tooltipInfo) {
                        if (tooltipInfo.tpe == 'SNP')
                            Msg.send({ type: 'ShowSNPPopup' }, tooltipInfo.snpid);
                    }
                }

                return that;
            },


        };


        return GenomeBrowserSNPChannel;
    });