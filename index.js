'use strict';

const boom = require('boom');
const mongo3Match = /collection: .*\..+ index: (.+)_\d+ dup/;
const mongo2Match = /E11000 duplicate key error index: .+\..+\.\$(.+)_\d+ {2}dup/;

const handleError = (err) => {
  // duplicate key
  if (err.code === 11000) {
    let fieldName = 'field';
    // try mongodb 3 error string first
    const m3 = err.message.match(mongo3Match);
    if (m3 !== null) fieldName = m3[1];
    else {
      // fallback to mongodb 2 error string
      const m2 = err.message.match(mongo2Match);
      if (m2 !== null) fieldName = m2[1];
    }
    return boom.conflict(`Entry with that ${fieldName} already exists`, {
      fieldName,
    });
  }
  return boom.badImplementation(err);
};

module.exports = (server, opts, next) => {
  server.decorate('reply', 'mquery', function(query) {
    return query.then(this.response.bind(this)).catch((e) => {
      return this.response(handleError(e));
    });
  });

  next();
};

exports.attributes = {
  pkg: require('./package.json'),
};
