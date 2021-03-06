'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var React = require('react');
var computer = require('./segment-computer.js');
var differ = require('./differ');
var assign = require('react/lib/Object.assign');
var dispatcher = require('./dispatcher');
var classnames = require('classnames');

var defaultProps = {
  label: '',
  // inner and outer radius, and segment padding
  r1: 0,
  r2: 1,
  spacing: 1,
  // start and end angle
  start: -computer.kappa,
  end: -computer.kappa + computer.tau,
  // total number of segments, and id of this segment
  depth: 0,
  id: 0,
  total: 1,
  // leaf settings
  leafRadius: 7,
  leafSpacing: 2,
  // optional key:value object for filtering which leaves to _not_ render
  filter: {}
};

var CircleSegment = React.createClass({
  displayName: 'CircleSegment',
  getDefaultProps: function getDefaultProps() {
    return defaultProps;
  },
  getInitialState: function getInitialState() {
    var tvalues = computer.getSegmentInformation(this.props);
    tvalues.highlight = false;
    if (this.props.depth === 0) {
      tvalues.status = "active primary";
    }
    return tvalues;
  },
  componentWillUpdate: function componentWillUpdate(nextProps, nextState) {
    if (differ(nextProps, this.props)) {
      this.setState(computer.getSegmentInformation(nextProps));
    }
  },
  componentWillMount: function componentWillMount() {
    this.highlightFunctions = {
      highlight: this.highlight,
      restore: this.restore,
      toggle: this.toggle,
      activate: this.activate
    };
  },
  componentWillUnmount: function componentWillUnmount() {
    dispatcher.off('react-circletree:click', this.onActivate);
  },
  componentDidMount: function componentDidMount() {
    this.props.updateBBox(this.state.bbox);
    dispatcher.on('react-circletree:click', this.onActivate);
  },
  updateBBox: function updateBBox(bbox) {
    var _this = this;

    var sbox = this.state.bbox.expand(bbox);
    this.setState({ bbox: sbox }, function () {
      _this.props.updateBBox(sbox);
    });
  },
  highlight: function highlight() {
    this.setState({ highlight: true });
    if (this.props.highlight) {
      this.props.highlight();
    }
  },
  restore: function restore() {
    this.setState({ highlight: false });
    if (this.props.restore) {
      this.props.restore();
    }
  },
  toggle: function toggle(labels) {
    labels = labels || [];
    if (this.props.toggle) {
      this.props.toggle([this.props.label].concat(labels));
    }
  },
  onActivate: function onActivate(e) {
    var _this2 = this;

    this.setState({
      status: false
    }, function () {
      if (e.detail.origin === _this2) {
        _this2.activate("active primary");
      }
    });
  },
  activate: function activate(status) {
    this.setState({ status: status });
    if (this.props.activate) {
      this.props.activate("active");
    }
  },
  render: function render() {
    return React.createElement(
      'g',
      { className: classnames(this.state.status, this.props.leaf ? "leaf" : "") },
      this.getPath(this.state),
      this.getLabel(this.state),
      this.props.leaf ? null : this.setupChildren(this.state)
    );
  },
  getPath: function getPath(tvalues) {
    var _this3 = this;

    return computer.getSVGPath(tvalues.points, assign({}, this.props, {
      angleDelta: tvalues.angleDelta,
      highlight: tvalues.highlight
    }), {
      onMouseEnter: this.highlight,
      onMouseLeave: this.restore,
      onClick: function onClick() {
        dispatcher.dispatch('react-circletree:click', { origin: _this3 });
        _this3.toggle();
      }
    });
  },
  getLabel: function getLabel(tvalues) {
    return computer.getSVGLabel(this.props, tvalues.center);
  },
  setupChildren: function setupChildren(tvalues) {
    var _this4 = this;

    var data = this.props.data;

    // Leaf nodes are encoded as array
    if (data.map) return this.formLeaves(tvalues);

    // real nodes are encoded as "more CircleSegments"
    var nr1 = this.props.r2 + this.props.spacing,
        nr2 = nr1 + (this.props.r2 - this.props.r1),
        keys = Object.keys(data),
        total = keys.length,
        props = assign({}, this.props, {
      total: total,
      r1: nr1,
      r2: nr2,
      start: tvalues.startAngle,
      end: tvalues.startAngle + tvalues.angleDelta,
      depth: this.props.depth + 1,
      updateBBox: this.updateBBox,
      fontSize: 14
    });

    // generate the set of child segments
    return keys.map(function (label, position) {
      var childProps = assign({}, props, _this4.highlightFunctions, {
        label: label,
        id: position,
        data: data[label]
      });
      return React.createElement(CircleSegment, _extends({}, childProps, { key: label }));
    });
  },
  formLeaves: function formLeaves(tvalues) {
    var _this5 = this;

    var baseProps = {
      leaf: true,
      start: tvalues.startAngle,
      updateBBox: this.updateBBox
    };

    return this.props.data.filter(function (type) {
      return !_this5.props.filter[type];
    }).map(function (type, pos) {
      var radius = _this5.props.r2,
          leafRadius = _this5.props.leafRadius,
          leafSpacing = _this5.props.leafSpacing,
          spacing = _this5.props.spacing,
          r1 = radius + spacing + pos * (leafSpacing + leafRadius),
          r2 = r1 + leafRadius,
          leafProps = assign({}, baseProps, _this5.highlightFunctions, {
        r1: r1,
        r2: r2,
        end: tvalues.startAngle + tvalues.angleDelta - tvalues.angleOffset,
        label: type
      });

      return React.createElement(CircleSegment, _extends({}, leafProps, { key: type }));
    });
  }
});

module.exports = CircleSegment;