const yaml = require('js-yaml');
const moment = require('moment');
const perspectiveAPI = require('./lib/perspectiveAPI');

module.exports = robot => {
  robot.on('issue_comment.created', async context => {
    if (!context.isBot) {
      const {body} = context.payload.comment;
      const config = await context.config('config.yml');
      const issue_comments = await context.github.issues.getComments(context.issue());
      // TO DO: add since parameter with time condition
      // probs use moment.js

      if (config && config.lockThreads && issue_comments.data.length >= config.lockThreads.numComments) {
        let toxicCommentCount = 0;
        let commented = false;
        issue_comments.data.forEach(function(comment) {
          robot.log(comment.body)
          if (!commented) {
            perspectiveAPI.googleAPICall(comment.body, function (res) {
              robot.log('res: ', res);
              if (res > config.lockThreads.toxicityThreshold && !commented) {
                // If the comment was toxic count it
                toxicCommentCount += 1;
                robot.log(toxicCommentCount, config.lockThreads.numComments)
                if (toxicCommentCount >= config.lockThreads.numComments && !commented) {
                  // If there are too many toxic comments,
                  // Bot should comment with the maintainer set reply and lock the thread
                  robot.log(config.lockThreads.replyComment);
                  //context.github.issues.createComment(context.issue({body: config.lockThreads.replyComment}));
                  commented = true;
                  // Lock thread API call here
                  robot.log('issue should get locked!', context.issue());
                  return context.github.issues.lock(context.issue());
                  // SOBS UNCONTROLLABLY 
                  😭
                }
              }
            });
          }
        });
      }
    }
  });
}
