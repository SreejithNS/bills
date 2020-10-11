import 'package:flutter/material.dart';

import 'AddNewProduct.dart';
import 'ViewProducts.dart';

class Inventory extends StatefulWidget {
  @override
  _InventoryState createState() => _InventoryState();
}

class _InventoryState extends State<Inventory> {
  @override
  Widget build(BuildContext context) {
    return SafeArea(
        child: Scaffold(
            appBar: AppBar(
              title: Text("Inventory"),
            ),
            body: Container(
              padding: EdgeInsets.all(12.0),
              child: Center(
                child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      new GestureDetector(
                        onTap: () {
                          Navigator.push(
                              context,
                              MaterialPageRoute(
                                  builder: (context) => ViewProducts()));
                        },
                        child: Card(
                          child: Padding(
                            padding: EdgeInsets.only(top: 5.0, bottom: 5.0),
                            child: new ListTile(
                              title: new Text(
                                "View Products",
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                ),
                                textAlign: TextAlign.center,
                              ),
                            ),
                          ),
                        ),
                      ),
                      SizedBox(height: 10.0),
                      new GestureDetector(
                        onTap: () {
                          Navigator.push(
                              context,
                              MaterialPageRoute(
                                  builder: (context) => AddNewProduct()));
                        },
                        child: Card(
                          child: Padding(
                            padding: EdgeInsets.only(top: 5.0, bottom: 5.0),
                            child: new ListTile(
                              title: new Text(
                                "Add New Product",
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                ),
                                textAlign: TextAlign.center,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ]),
              ),
            )));
  }
}
