import { Application } from '@pixi/app';
import { Ticker, TickerPlugin } from '@pixi/ticker';

Application.registerPlugin(TickerPlugin);
Live2DModel.registerTicker(Ticker);
