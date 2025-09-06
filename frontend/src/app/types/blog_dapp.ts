/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/blog_dapp.json`.
 */
export type BlogDapp = {
  "address": "9MFy53ajGDaY3EqidnZfyYhwXNa5rxjTahhyRpKv9ZWN",
  "metadata": {
    "name": "blogDapp",
    "version": "0.2.0",
    "spec": "0.1.0"
  },
  "instructions": [
    {
      "name": "createPost",
      "discriminator": [
        123,
        92,
        184,
        29,
        231,
        24,
        15,
        202
      ],
      "accounts": [
        {
          "name": "post",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  115,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "blog"
              },
              {
                "kind": "account",
                "path": "blog.post_count",
                "account": "blog"
              }
            ]
          }
        },
        {
          "name": "blog",
          "writable": true
        },
        {
          "name": "author",
          "writable": true,
          "signer": true,
          "relations": [
            "blog"
          ]
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "title",
          "type": "string"
        },
        {
          "name": "tags",
          "type": {
            "vec": "string"
          }
        }
      ]
    },
    {
      "name": "deletePost",
      "discriminator": [
        208,
        39,
        67,
        161,
        55,
        13,
        153,
        42
      ],
      "accounts": [
        {
          "name": "post",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  115,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "post.blog",
                "account": "post"
              },
              {
                "kind": "account",
                "path": "post.id",
                "account": "post"
              }
            ]
          }
        },
        {
          "name": "author",
          "writable": true,
          "signer": true,
          "relations": [
            "post"
          ]
        }
      ],
      "args": []
    },
    {
      "name": "initializeBlog",
      "discriminator": [
        195,
        223,
        187,
        134,
        244,
        232,
        54,
        32
      ],
      "accounts": [
        {
          "name": "blog",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  108,
                  111,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "author"
              }
            ]
          }
        },
        {
          "name": "author",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "title",
          "type": "string"
        },
        {
          "name": "description",
          "type": "string"
        }
      ]
    },
    {
      "name": "updatePost",
      "discriminator": [
        151,
        128,
        207,
        107,
        169,
        246,
        241,
        107
      ],
      "accounts": [
        {
          "name": "post",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  115,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "post.blog",
                "account": "post"
              },
              {
                "kind": "account",
                "path": "post.id",
                "account": "post"
              }
            ]
          }
        },
        {
          "name": "author",
          "signer": true,
          "relations": [
            "post"
          ]
        }
      ],
      "args": [
        {
          "name": "title",
          "type": {
            "option": "string"
          }
        },
        {
          "name": "tags",
          "type": {
            "option": {
              "vec": "string"
            }
          }
        }
      ]
    },
    {
      "name": "updatePostContent",
      "discriminator": [
        174,
        105,
        108,
        52,
        80,
        220,
        151,
        106
      ],
      "accounts": [
        {
          "name": "post",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  115,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "post.blog",
                "account": "post"
              },
              {
                "kind": "account",
                "path": "post.id",
                "account": "post"
              }
            ]
          }
        },
        {
          "name": "author",
          "writable": true,
          "signer": true,
          "relations": [
            "post"
          ]
        }
      ],
      "args": [
        {
          "name": "contentChunk",
          "type": "string"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "blog",
      "discriminator": [
        152,
        205,
        212,
        154,
        186,
        203,
        207,
        244
      ]
    },
    {
      "name": "post",
      "discriminator": [
        8,
        147,
        90,
        186,
        185,
        56,
        192,
        150
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "titleTooLong",
      "msg": "Title is too long"
    },
    {
      "code": 6001,
      "name": "descriptionTooLong",
      "msg": "Description is too long"
    },
    {
      "code": 6002,
      "name": "contentTooLong",
      "msg": "Content is too long"
    },
    {
      "code": 6003,
      "name": "tooManyTags",
      "msg": "Too many tags"
    },
    {
      "code": 6004,
      "name": "postNotFound",
      "msg": "Post not found or already deleted"
    },
    {
      "code": 6005,
      "name": "unauthorizedAuthor",
      "msg": "Unauthorized: Only the author can perform this action"
    }
  ],
  "types": [
    {
      "name": "blog",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "author",
            "type": "pubkey"
          },
          {
            "name": "title",
            "type": "string"
          },
          {
            "name": "description",
            "type": "string"
          },
          {
            "name": "postCount",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "post",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "author",
            "type": "pubkey"
          },
          {
            "name": "blog",
            "type": "pubkey"
          },
          {
            "name": "id",
            "type": "u64"
          },
          {
            "name": "title",
            "type": "string"
          },
          {
            "name": "content",
            "type": "string"
          },
          {
            "name": "tags",
            "type": {
              "vec": "string"
            }
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "updatedAt",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ]
};
