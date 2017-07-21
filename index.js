const yaml = require('js-yaml');
const moment = require('moment');
const perspectiveAPI = require('./lib/perspectiveAPI');

module.exports = robot => {
    robot.on('issue_comment.created', async context => {
        const {body} = context.payload.comment;
        try {
            const options = context.repo({path: '.github/config.yml'});
            const response = await context.github.repos.getContent(options);
            config = yaml.load(Buffer.from(response.data.content, 'base64').toString()) || {};
        } catch (err) {
            if (err.code !== 404) throw err;
        }
        robot.log(config.lockThreads);
        let issue_comments = await context.github.issues.getComments(context.issue());
        // TO DO: add since parameter with time condition
        // probs use moment.js
        robot.log(issue_comments);
        
        if (config && config.lockThreads && issue_comments.data.length >= config.lockThreads.numComments) {
            let toxicCommentCount = 0;
            issue_comments.data.forEach(function(comment) {
                robot.log(comment.body)
                perspectiveAPI.googleAPICall(comment.body, function (res) {
                    robot.log('res: ', res);
                    if (res > config.lockThreads.toxicityThreshold) {
                        // If the comment was toxic count it
                        toxicCommentCount += 1;
                        robot.log(toxicCommentCount, config.lockThreads.numComments)
                        if (toxicCommentCount >= config.lockThreads.numComments) {
                            // If there are too many toxic comments,
                            // Bot should comment with the maintainer set reply and lock the thread
                            robot.log(config.lockThreads.replyComment);
                            context.github.issues.createComment(context.issue({body: config.lockThreads.replyComment}));
                            // Lock thread API call here
                            context.github.issues.lock(context.issue());
                            // SOBS UNCONTROLLABLY
                        }
                    }
                });
            });
        }
    });
}
