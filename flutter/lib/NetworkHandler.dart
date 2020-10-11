import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;

class NetworkHandler {
  String baseurl = "http://sreejith-5a562523.localhost.run/api";
  FlutterSecureStorage storage = FlutterSecureStorage();

  // Get Request
  Future get(String url) async {
    String token = await storage.read(key: "token");
    url = formater(url);

    var response = await http.get(
      url,
      headers: {"Authorization": "Bearer $token"},
    );
    if (response.statusCode == 200 || response.statusCode == 201) {
      return json.decode(response.body);
    }
  }

  //Post Request
  Future<http.Response> post(String url, Map<String, String> body) async {
    String token = await storage.read(key: "token");
    url = formater(url);
    print(
        {"Content-type": "application/json", "Authorization": "Bearer $token"});
    var response = await http.post(
      url,
      headers: {
        "Content-type": "application/json",
        "Authorization": "Bearer $token"
      },
      body: json.encode(body),
    );
    return response;
  }

  Future<http.Response> put(String url, Map<String, String> body) async {
    String token = await storage.read(key: "token");
    url = formater(url);
    print(
        {"Content-type": "application/json", "Authorization": "Bearer $token"});
    var response = await http.put(
      url,
      headers: {
        "Content-type": "application/json",
        "Authorization": "Bearer $token"
      },
      body: json.encode(body),
    );
    return response;
  }

  Future<http.Response> delete(String url) async {
    String token = await storage.read(key: "token");
    url = formater(url);
    print(
        {"Content-type": "application/json", "Authorization": "Bearer $token"});
    var response = await http.delete(url, headers: {
      "Content-type": "application/json",
      "Authorization": "Bearer $token"
    });
    return response;
  }

  String formater(String url) {
    return baseurl + url;
  }
}
