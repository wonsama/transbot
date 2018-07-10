# How to become a contributor and submit your own code

## Issue reporting

* Check that the issue has not [already been reported](https://github.com/wonsama/transbot/issues).
* Check that the issue has not already been fixed in the latest code
  (a.k.a. `master`).
* Be clear, concise and precise in your description of the problem.
* Open an issue with a descriptive title and a summary in grammatically correct,
  complete sentences.
* Include any relevant code to the issue summary.


## Pull requests

* Read [how to properly contribute to open source projects on Github](http://gun.io/blog/how-to-github-fork-branch-and-pull-request).
* Fork the project.
* Install all dependencies including development requirements by running: `$ npm install -d`
* Use a topic/feature branch to easily amend a pull request later, if necessary.
* Write [good commit messages](http://tbaggery.com/2008/04/19/a-note-about-git-commit-messages.html).
* Use the same coding conventions as the rest of the project.
* Commit and push until you are happy with your contribution.
* Make sure to add tests for it. This is important so I don't break it
  in a future version unintentionally.
* Add an entry to the [Changelog](CHANGELOG.md) accordingly. See
  [changelog entry format](#changelog-entry-format).
* Please try not to mess with the package.json or version. If you want to
  have your own version, or is otherwise necessary, that is fine, but please
  isolate to its own commit so I can cherry-pick around it.
* Make sure the test suite is passing
  * Tests are run using mocha. To run all tests just run: `$ npm test`
    which looks for tests in the `test/` directory.
* Make sure the no new style offenses are added. Your code should honor the
  [Google JavaScript Style Guide](https://google-styleguide.googlecode.com/svn/trunk/javascriptguide.xml).
  * At least make sure no jslint errors occur.  This run using npm as follows: `$ npm run lint`
* [Squash related commits together](http://gitready.com/advanced/2009/02/10/squashing-commits-with-rebase.html).
* Open a [pull request](https://help.github.com/articles/using-pull-requests) that relates to *only* one subject with a clear title
  and description in grammatically correct, complete sentences.

### Changelog entry format

Here are a few examples:

```
* Obtains the key from values ([@wonsama][])
* [#36](wonsama/transbot#36) Adds an implementation of fast translation ([@wonsama][])
```
