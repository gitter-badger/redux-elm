import React, { PropTypes } from 'react';
import { render } from 'react-dom';
import { createStore, combineReducers, applyMiddleware, compose } from 'redux';
import { connect, Provider } from 'react-redux';
import { createDevTools } from 'redux-devtools';
import LogMonitor from 'redux-devtools-log-monitor';
import DockMonitor from 'redux-devtools-dock-monitor';
import { syncHistoryWithStore, routerReducer as routing, LOCATION_CHANGE } from 'react-router-redux';
import { hashHistory, Router, Route, Link } from 'react-router';
import { forwardTo, patternMatch } from 'redux-elm';
import sagaMiddleware from 'redux-saga-rxjs';
import { Observable } from 'rxjs';

import composeSaga from './composeSaga';
import { View as FirstExampleView, update as firstExampleUpdate } from './1-counter/main';
import { View as SecondExampleView, update as secondExampleUpdate } from './2-pair-of-counters/main';
import { View as ThirdExampleView, update as thirdExampleUpdate } from './3-a-dynamic-list-of-counters/main';
import { View as FourthExampleView, update as fourthExampleUpdate, saga as fourthExampleSaga, Actions as FourthExampleActions } from './4-random-gif-viewer/main';
import { View as FifthExampleView, update as fifthExampleUpdate, saga as fifthExampleSaga, Actions as FifthExampleActions } from './5-pair-of-random-gif-viewers/main';
import { View as SixthExampleView, update as sixthExampleUpdate, saga as sixthExampleSaga } from './6-list-of-random-gif-viewers/main';

const INDEX_PAGE = '/';

const EXAMPLE_1 = {
  id: '1-counter',
  title: 'Counter',
  View: FirstExampleView,
  update: firstExampleUpdate
};

const EXAMPLE_2 = {
  id: '2-pair-of-counters',
  title: 'Pair of Counters',
  View: SecondExampleView,
  update: secondExampleUpdate
};

const EXAMPLE_3 = {
  id: '3-a-dynamic-list-of-counters',
  title: 'Dynamic List of Counters',
  View: ThirdExampleView,
  update: thirdExampleUpdate
};

const EXAMPLE_4 = {
  id: '4-random-gif-viewer',
  title: 'Random GIF Viewer',
  View: FourthExampleView,
  update: fourthExampleUpdate
};

const EXAMPLE_5 = {
  id: '5-pair-of-random-gif-viewers',
  title: 'Pair of Random GIF Viewers',
  View: FifthExampleView,
  update: fifthExampleUpdate
};

const EXAMPLE_6 = {
  id: '6-list-of-random-gif-viewers',
  title: 'List of Random GIF Viewers',
  View: SixthExampleView,
  update: sixthExampleUpdate
};

const PAGES = [
  EXAMPLE_1,
  EXAMPLE_2,
  EXAMPLE_3,
  EXAMPLE_4,
  EXAMPLE_5,
  EXAMPLE_6
];

const initialState = PAGES.reduce((memo, page) => ({ ...memo, [page.id]: page.update() }), {});

const update = patternMatch(initialState)
  .case('[ExamplePageId]', (model, action) => {
    const example = PAGES.find(page => page.id === action.match.ExamplePageId);

    if (example) {
      return { ...model, [example.id]: example.update(model[example.id], action) };
    } else {
      return model;
    }
  });

const IndexPage = () => (
  <ol>
    {PAGES.map(view => <li key={view.id}><Link to={`/${view.id}`}>{view.title}</Link></li>)}
  </ol>
);

const buildComponent = page => connect(appState => ({model: appState.model[page.id]}))(
  ({model, dispatch}) => <page.View dispatch={forwardTo(dispatch, page.id)} model={model} />);

const MainView = ({ history }) => {
  return (
    <Router history={history}>
      <Route path={INDEX_PAGE} component={IndexPage} />
      <Route path={INDEX_PAGE}>
        {PAGES.map(page => <Route key={page.id} path={page.id} component={buildComponent(page)} />)}
      </Route>
    </Router>
  );
};

MainView.propTypes = {
  history: PropTypes.object.isRequired
};

const reducer = combineReducers({
  model: update,
  routing
});

const initSaga = iterable => iterable
  .filter(({ action }) => action.type === LOCATION_CHANGE)
  .flatMap(({ action }) => {
    switch (action.payload.pathname.substring(1)) {
    case EXAMPLE_4.id:
      return Observable.of({ type: `${EXAMPLE_4.id}.${FourthExampleActions.Init}`, payload: 'cat' });

    case EXAMPLE_5.id:
      return Observable.of({ type: `${EXAMPLE_5.id}.${FifthExampleActions.InitPair}` });

    default:
      return Observable.of();
    }
  });

const DevTools = createDevTools(
  <DockMonitor toggleVisibilityKey="ctrl-h"
               changePositionKey="ctrl-w">
    <LogMonitor />
  </DockMonitor>
);

const store = createStore(reducer, undefined, compose(applyMiddleware(
  sagaMiddleware(
    initSaga,
    composeSaga(fourthExampleSaga, '[ExamplePageId]'),
    composeSaga(fifthExampleSaga, '[ExamplePageId]'),
    composeSaga(sixthExampleSaga, '[ExamplePageId]')
  )
), DevTools.instrument()));
const history = syncHistoryWithStore(hashHistory, store);

const Application = () => (
  <div>
    <Provider store={store}>
      <MainView history={history} />
    </Provider>
    <DevTools store={store} />
  </div>
);

render(<Application />, document.getElementById('app'));
