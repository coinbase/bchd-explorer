# Copyright 2020 Coinbase, Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# build stage
# The Node version is pinned explicitly: this stack (Vue CLI 4 / webpack 4)
# predates the OpenSSL 3 hash changes in Node 17+ and must stay on Node 16.
# A specific version tag also keeps builds reproducible instead of tracking a
# mutable floating tag such as lts-alpine.
FROM node:16.20.2-alpine as build-stage
WORKDIR /app
COPY package*.json ./
# npm ci installs exactly the versions pinned in package-lock.json.
RUN npm ci
COPY . .
RUN npm run build

# production stage
# Pinned to a concrete nginx release instead of the drifting stable-alpine tag
# so that image rebuilds do not silently pick up new upstream releases.
FROM nginx:1.24-alpine as production-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
