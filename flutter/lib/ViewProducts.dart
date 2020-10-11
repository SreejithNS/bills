import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter/material.dart';
import 'NetworkHandler.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'UpdateProduct.dart';

class ViewProducts extends StatefulWidget {
  @override
  _ViewProductsState createState() => _ViewProductsState();
}

class _ViewProductsState extends State<ViewProducts> {
  List _productsForDisplay = [];
  final storage = new FlutterSecureStorage();
  NetworkHandler networkHandler = NetworkHandler();
  var response;
  List Products = [];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
        appBar: AppBar(
          title: Text('View Products'),
        ),
        body: ListView.builder(
          itemBuilder: (context, index) {
            return index == 0
                ? Padding(
                    padding: EdgeInsets.all(16.0),
                    child: TextField(
                      decoration: InputDecoration(hintText: 'Search...'),
                      onChanged: (text) {
                        text = text.toLowerCase();
                        if (text == "") {
                          Products = [];
                        } else {
                          setState(() async {
                            String token = await storage.read(key: "token");
                            var res = await http.get(
                                "http://sreejith-5a562523.localhost.run/api/product/suggestions/$text",
                                headers: {
                                  "Content-type": "application/json",
                                  "Authorization": "Bearer $token"
                                });
                            print(res.statusCode);
                            var resBody = json.decode(res.body);
                            print(resBody["data"]);
                            print(resBody["message"]);
                            _productsForDisplay.addAll(resBody["data"]);
                            setState(() {
                              Products = _productsForDisplay;
                              _productsForDisplay = [];
                            });
                          });
                        }
                      },
                    ))
                : _listItem(index - 1);
          },
          itemCount: Products.length + 1,
        ));
  }

  _listItem(index) {
    return GestureDetector(
        onTap: () {
          Navigator.push(
              context,
              MaterialPageRoute(
                  builder: (context) => UpdateProduct(
                      Products[index]["code"],
                      Products[index]["name"],
                      Products[index]["mrp"].toString(),
                      Products[index]["rate"].toString(),
                      Products[index]["id"])));
        },
        child: Card(
            child: ListTile(
          title: Text(Products[index]["name"]),
          subtitle: Text(Products[index]["mrp"].toString()),
        )));
  }
}
