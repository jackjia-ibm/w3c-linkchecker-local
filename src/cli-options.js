/**
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v2.0 which accompanies this
 * distribution, and is available at https://www.eclipse.org/legal/epl-v20.html
 *
 * SPDX-License-Identifier: EPL-2.0
 */

// CLI options for w3c-linkcheker-local
const CliOptions = {
  verbose: {
    description: 'Verbose mode.',
    alias: 'v',
    type: 'boolean',
    default: false,
  },
  'no-color': {
    desc: 'Do not display output with colors',
    type: 'boolean',
    default: false,
  },
  'base-url': {
    description: 'Serve files using alternative base url.',
    type: 'string',
    default: '/',
  },
  'checklink-command': {
    description: 'W3C checklink command location.',
    type: 'string',
  },
  'ignore-robots-forbidden': {
    desc: 'Ignore errors of URL denied by robots.txt. Example error message is "Forbidden by robots.txt".',
    type: 'boolean',
    default: false,
  },
  'ignore-broken-fragments': {
    desc: 'Ignore errors of broken fragments in pages. Example error message is "Some of the links to this resource point to broken URI fragments (such as index.html#fragment).".',
    type: 'boolean',
    default: false,
  },
  'ignore-redirection': {
    desc: 'Ignore errors of URL redirection. Example error message is "The link is missing a trailing slash, and caused a redirect." or "This is a permanent redirect. The link should be updated.".',
    type: 'boolean',
    default: false,
  },

  // below options are defined by w3c checklink and will be copied over
  // check `checklink` menual for more details:
  // https://metacpan.org/pod/distribution/W3C-LinkChecker/bin/checklink.pod
  summary: {
    desc: 'Show result summary only.',
    alias: 's',
    type: 'boolean',
    default: false,
  },
  broken: {
    desc: 'Show only the broken links, not the redirects.',
    alias: 'b',
    type: 'boolean',
    default: false,
  },
  directory: {
    desc: 'Hide directory redirects - e.g. http://www.w3.org/TR -> http://www.w3.org/TR/.',
    alias: 'e',
    type: 'boolean',
    default: false,
  },
  recursive: {
    desc: 'Check the documents linked from the first one.',
    alias: 'r',
    type: 'boolean',
    default: false,
  },
  depth: {
    desc: 'Check the documents linked from the first one to depth n (implies --recursive).',
    alias: 'D',
    type: 'number',
  },
  location: {
    desc: 'Scope of the documents checked (implies --recursive). Can be specified multiple times in order to specify multiple recursion bases. If the URI of a candidate document is downwards relative to any of the bases, it is considered to be within the scope. If not specified, the default is the base URI of the initial document, for example for http://www.w3.org/TR/html4/Overview.html it would be http://www.w3.org/TR/html4/.',
    alias: 'l',
    type: 'array',
  },
  exclude: {
    desc: 'Do not check links whose full, canonical URIs match regexp. Note that this option limits recursion the same way as --exclude-docs with the same regular expression would.',
    alias: 'X',
    type: 'string',
  },
  'exclude-docs': {
    desc: 'In recursive mode, do not check links in documents whose full, canonical URIs match regexp. This option may be specified multiple times.',
    type: 'array',
  },
  'suppress-redirect': {
    desc: 'Do not report a redirect from the first to the second URI. The "->" is literal text. This option may be specified multiple times. Whitespace may be used instead of "->" to separate the URIs.',
    type: 'array',
  },
  'suppress-redirect-prefix': {
    desc: 'Do not report a redirect from a child of the first URI to the same child of the second URI. The "->" is literal text. This option may be specified multiple times. Whitespace may be used instead of "->" to separate the URIs.',
    type: 'array',
  },
  'suppress-temp-redirects': {
    desc: 'Do not report warnings about temporary redirects.',
    type: 'boolean',
    default: false,
  },
  'suppress-broken': {
    desc: 'Do not report a broken link with the given CODE. CODE is the HTTP response, or -1 for robots exclusion. The ":" is literal text. This option may be specified multiple times. Whitespace may be used instead of ":" to separate the CODE and the URI.',
    type: 'array',
  },
  'suppress-fragment': {
    desc: 'Do not report the given broken fragment URI. A fragment URI contains "#". This option may be specified multiple times.',
    type: 'array',
  },
  languages: {
    desc: 'ScopeThe Accept-Language HTTP header to send. In command line mode, this header is not sent by default. The special value auto causes a value to be detected from the LANG environment variable, and sent if found. In CGI mode, the default is to send the value received from the client as is.',
    alias: 'L',
    type: 'string',
  },
  cookies: {
    desc: 'ScopeUse cookies, load/save them in cookie-file. The special value tmp causes non-persistent use of cookies, i.e. they are used but only stored in memory for the duration of this link checker run.',
    alias: 'c',
    type: 'string',
  },
  'no-referer': {
    desc: 'Do not send the Referer HTTP header.',
    alias: 'R',
    type: 'boolean',
    default: false,
  },
  quiet: {
    desc: 'ScopeNo output if no errors are found. Implies --summary.',
    alias: 'q',
    type: 'boolean',
    default: false,
  },
  indicator: {
    desc: 'Show progress while parsing as percentage of lines processed. No indicator is shown for documents containing no linefeeds.',
    alias: 'i',
    type: 'boolean',
    default: false,
  },
  user: {
    desc: 'Specify a username for authentication.',
    alias: 'u',
    type: 'string',
  },
  password: {
    desc: 'Specify a password for authentication.',
    alias: 'p',
    type: 'string',
  },
  'hide-same-realm': {
    desc: 'Hide 401\'s that are in the same realm as the document checked.',
    type: 'boolean',
    default: false,
  },
  sleep: {
    desc: 'Sleep the specified number of seconds between requests to each server. Defaults to 1 second, which is also the minimum allowed.',
    alias: 'S',
    type: 'number',
  },
  timeout: {
    desc: 'Timeout for requests, in seconds. The default is 30.',
    alias: 't',
    type: 'number',
  },
  'connection-cache': {
    desc: 'Maximum number of cached connections. Using this option overrides the Connection_Cache_Size configuration file parameter, see its documentation below for the default value and more information.',
    alias: 'C',
    type: 'number',
  },
  domain: {
    desc: 'Perl regular expression describing the domain to which the authentication information (if present) will be sent. The default value can be specified in the configuration file. See the Trusted entry in the configuration file description below for more information.',
    alias: 'd',
    type: 'string',
  },
};

// default command line options for w3c checklink command
const CheckLinkOptions = [
  // '--quiet',
  // '--indicator',
];

module.exports = {
  CliOptions,
  CheckLinkOptions,
};
