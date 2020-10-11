import 'package:bills/CreateBill.dart';
import 'package:bills/Customers.dart';
import 'package:bills/Inventory.dart';
import 'package:bills/TransactionAnalysis.dart';
import 'package:flutter/material.dart';

class HomePage extends StatefulWidget {
  @override
  _HomePageState createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  @override
  Widget build(BuildContext context) {
    return SafeArea(
        child: Scaffold(
            appBar: AppBar(
              title: Text("Bills"),
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
                                  builder: (context) => CreateBill()));
                        },
                        child: Card(
                          child: Padding(
                            padding: EdgeInsets.only(top: 5.0, bottom: 5.0),
                            child: new ListTile(
                              title: new Text(
                                "Create Bill",
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
                                  builder: (context) => Customers()));
                        },
                        child: Card(
                          child: Padding(
                            padding: EdgeInsets.only(top: 5.0, bottom: 5.0),
                            child: new ListTile(
                              title: new Text(
                                "Customers",
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
                                  builder: (context) => Inventory()));
                        },
                        child: Card(
                          child: Padding(
                            padding: EdgeInsets.only(top: 5.0, bottom: 5.0),
                            child: new ListTile(
                              title: new Text(
                                "Inventory",
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
                                  builder: (context) => TransactionAnalysis()));
                        },
                        child: Card(
                          child: Padding(
                            padding: EdgeInsets.only(top: 5.0, bottom: 5.0),
                            child: new ListTile(
                              title: new Text(
                                "Transaction analysis ",
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                ),
                                textAlign: TextAlign.center,
                              ),
                            ),
                          ),
                        ),
                      )
                    ]),
              ),
            )));
  }
}
