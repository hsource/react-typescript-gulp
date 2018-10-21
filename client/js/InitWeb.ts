import '@babel/polyfill';
import React from 'react';
import ReactDOM from 'react-dom';
import MainRouter from '../templates/MainRouter';

document.addEventListener('DOMContentLoaded', () => {
  ReactDOM.hydrate(
    React.createElement(MainRouter),
    document.getElementById('react-main'),
  );
});
