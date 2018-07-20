const googleapis = require('googleapis');

exports.googleAPICall = async function (comment, callback) {
    discovery_url = 'https://commentanalyzer.googleapis.com/$discovery/rest?version=v1alpha1';
    let val;
    return googleapis.discoverAPI(discovery_url, (err, client) => {
        if (err) throw err;
        var analyze_request = {
            comment: {'text': comment},
            requestedAttributes: {'TOXICITY': {}}
        };
        return client.comments.analyze({key: process.env.PERSPECTIVE_API_KEY, resource: analyze_request}, (err, response) => {
            if (err) throw err;
            val = response.attributeScores.TOXICITY.spanScores[0].score.value;
            return callback(val);
        });
    });
};
